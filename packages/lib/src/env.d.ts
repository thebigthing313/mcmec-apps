/**
 * `@mcmec/lib` is consumed as source by Vite apps, never by the Node api, so `import.meta.env`
 * is always present at runtime. Vite’s own `vite/client` types are not — this package has no
 * Vite dependency and should not grow one for a single string.
 */
interface ImportMetaEnv {
	readonly VITE_ASSETS_ORIGIN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
