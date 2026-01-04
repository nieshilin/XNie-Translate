import { config } from '@vue/test-utils'

// 配置Vue Test Utils
config.global.stubs = {
  // 可以在这里添加全局stubs
}

config.global.mocks = {
  // 可以在这里添加全局mocks
  $t: (key: string) => key // 简单的i18n mock
}

// 添加全局测试工具
globalThis.window = window as any
globalThis.document = document as any
globalThis.navigator = navigator as any
