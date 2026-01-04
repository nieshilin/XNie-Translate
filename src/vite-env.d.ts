/// <reference types="vite/client" />

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}