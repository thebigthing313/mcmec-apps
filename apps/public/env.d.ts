/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
	readonly VITE_APP_NAME: string;
	readonly VITE_DOMAIN_NAME: string;
	readonly VITE_CLOUDFLARE_TURNSTILE_SITEKEY: string;
}

// biome-ignore lint/correctness/noUnusedVariables: This interface is used for global type augmentation.
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
