import type { User } from '#lib/server/db.ts';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
		}
	}
}

export {};
