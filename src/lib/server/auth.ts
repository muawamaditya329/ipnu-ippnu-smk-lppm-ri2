import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/env';
import type { Cookies } from '@sveltejs/kit';
import { db, type User } from './db';

const SESI_COOKIE = 'sesi_komisariat';
const UMUR_SESI_HARI = 30;

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(':');
	if (!salt || !hash) return false;
	const kandidat = scryptSync(password, salt, 64);
	const asli = Buffer.from(hash, 'hex');
	return kandidat.length === asli.length && timingSafeEqual(kandidat, asli);
}

/** Coba login; jika sukses set cookie sesi dan kembalikan user-nya. */
export function login(
	cookies: Cookies,
	username: string,
	password: string
): { ok: true; user: User } | { ok: false; pesan: string } {
	const row = db
		.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
		.get(username.trim()) as
		| (User & { password_hash: string; aktif: number })
		| undefined;

	if (!row || !verifyPassword(password, row.password_hash)) {
		return { ok: false, pesan: 'Username atau password salah.' };
	}
	if (!row.aktif) {
		return { ok: false, pesan: 'Akun dinonaktifkan. Hubungi admin.' };
	}

	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + UMUR_SESI_HARI * 24 * 3600 * 1000);
	db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
		token,
		row.id,
		expires.toISOString()
	);

	cookies.set(SESI_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires
	});

	const { password_hash: _ph, aktif: _a, ...user } = row;
	return { ok: true, user };
}

export function getSessionUser(token: string | undefined): User | null {
	if (!token) return null;
	const row = db
		.prepare(
			`SELECT u.id, u.nama, u.username, u.role
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.token = ? AND s.expires_at > datetime('now') AND u.aktif = 1`
		)
		.get(token) as User | undefined;
	return row ?? null;
}

export function logout(cookies: Cookies): void {
	const token = cookies.get(SESI_COOKIE);
	if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
	cookies.delete(SESI_COOKIE, { path: '/' });
}
