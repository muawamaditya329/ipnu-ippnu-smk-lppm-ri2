import type { PageServerLoad } from './$types';

// Seluruh konten halaman berasal dari data.settings yang sudah dimuat layout (publik).
export const load: PageServerLoad = async () => {
	return {};
};
