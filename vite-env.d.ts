/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_URL: string
  // add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
