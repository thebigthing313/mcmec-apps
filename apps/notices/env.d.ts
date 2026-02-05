/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
	readonly VITE_APP_NAME: string;
	readonly VITE_DOMAIN_NAME: string;
}

//biome-ignore lint/correctness/noUnusedVariables: The ImportMeta interface needs to have the env property
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
