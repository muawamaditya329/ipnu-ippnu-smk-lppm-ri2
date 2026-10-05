import type { User } from '#lib/server/db.ts';
import type { AnggotaSesi } from '#lib/server/auth-anggota.ts';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			/** Anggota yang sedang masuk via sesi anggota (cookie sesi_anggota) — null bila tidak ada. */
			anggota: AnggotaSesi | null;
		}
	}
}

export {};
