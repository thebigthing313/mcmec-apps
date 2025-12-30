/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            readonly SUPABASE_SECRET_KEY: string;
        }
    }
}