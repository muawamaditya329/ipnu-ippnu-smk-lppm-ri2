import { getSettings } from '#lib/server/settings.ts';

export const load = () => {
	return { settings: getSettings() };
};
