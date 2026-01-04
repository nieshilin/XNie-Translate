import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTranslation } from './useTranslation'

describe('useTranslation', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { translationResult, status, error } = useTranslation()
    
    expect(translationResult.value).toBe('')
    expect(status.value).toBe('就绪')
    expect(error.value).toBeNull()
  })

  it('should set loading status when translate is called', async () => {
    // Mock fetch API
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Hello World'
          }
        }]
      })
    }) as any

    const { translate, status } = useTranslation()
    
    const promise = translate('你好世界', 'zh', 'en')
    
    // 翻译进行中应该显示加载状态
    expect(status.value).toBe('翻译中…')
    
    await promise
  })

  it('should handle translation success', async () => {
    const mockTranslation = 'Hello World'
    
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: mockTranslation
          }
        }]
      })
    }) as any

    const { translate, translationResult, status } = useTranslation()
    
    await translate('你好世界', 'zh', 'en')
    
    expect(translationResult.value).toBe(mockTranslation)
    expect(status.value).toBe('完成')
  })

  it('should handle translation error', async () => {
    const errorMessage = 'Network Error'
    
    window.fetch = vi.fn().mockRejectedValue(new Error(errorMessage)) as any

    const { translate, status, error } = useTranslation()
    
    await translate('你好世界', 'zh', 'en')
    
    expect(status.value).toBe('错误')
    expect(error.value).not.toBeNull()
    expect(error.value?.message).toContain(errorMessage)
  })

  it('should handle empty input', async () => {
    const { translate, translationResult } = useTranslation()
    
    await translate('', 'zh', 'en')
    
    expect(translationResult.value).toBe('')
  })
})
