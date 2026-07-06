/// <reference types="vite/client" />

declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USER_ID?: string
  readonly VITE_SPACE_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
