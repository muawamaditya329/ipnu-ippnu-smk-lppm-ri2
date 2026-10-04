// Deklarasi modul Vite ?raw (mis. import skema from './schema.sql?raw')
declare module '*?raw' {
	const isi: string;
	export default isi;
}
