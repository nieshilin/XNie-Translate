import { ref, Ref } from 'vue'

// API响应类型定义
export interface ChatGPTResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 错误类型定义
export interface TranslationError {
  message: string;
  code?: number;
}

// 翻译状态类型定义
export type TranslationStatus = '就绪' | '翻译中…' | '完成' | '错误' | `重试中 (${number}/${number})…`

/**
 * 防抖函数
 * @param func - 要执行的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖处理后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

/**
 * 翻译功能组合式函数
 * 提供文本翻译、状态管理、错误处理和重试机制
 */
export const useTranslation = () => {
  /** 翻译结果 */
  const translationResult: Ref<string> = ref('')
  /** 翻译状态 */
  const status: Ref<TranslationStatus> = ref('就绪')
  /** 翻译错误信息 */
  const error: Ref<TranslationError | null> = ref(null)
  
  // 重试计数器
  const retryCount: Ref<number> = ref(0)
  const maxRetries = 2
  
  // API配置
  const apiKey = import.meta.env.VITE_API_KEY || 'sk-YhO01bMADaRDFeym1f6aCcB750F3472c8dE9E16eE8236cFd'
  const apiUrl = import.meta.env.VITE_API_URL || 'https://free.v36.cm/v1/chat/completions'
  
  /**
   * 执行翻译功能
   * @param inputText - 要翻译的文本
   * @param sourceLanguage - 源语言代码
   * @param targetLanguage - 目标语言代码
   * @returns Promise<string | null> - 返回翻译结果，失败时返回null
   */
  const translate = async (inputText: string, sourceLanguage: string, targetLanguage: string) => {
    if (!inputText.trim()) {
      translationResult.value = ''
      status.value = '就绪'
      error.value = null
      return
    }
    
    // 检查网络连接
    if (!navigator.onLine) {
      translationResult.value = '无网络连接，请检查您的网络。'
      status.value = '错误'
      error.value = { message: '无网络连接' }
      return
    }
    
    status.value = '翻译中…'
    error.value = null
    
    try {
      // 构建翻译提示词
      const prompt = sourceLanguage === 'auto' 
        ? `Detect the language of the following text and translate it to ${targetLanguage}: "${inputText}". Only return the translated text without any additional explanation.`
        : `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${inputText}". Only return the translated text without any additional explanation.`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Please translate the text accurately without any additional content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (response.status === 429) {
          // 处理API速率限制
          throw new Error('请求过于频繁，请稍后再试。')
        } else if (response.status >= 500) {
          // 服务器错误，尝试重试
          if (retryCount.value < maxRetries) {
            retryCount.value++
            status.value = `重试中 (${retryCount.value}/${maxRetries})…`
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.value))
            return translate(inputText, sourceLanguage, targetLanguage)
          } else {
            throw new Error('服务器错误，请稍后再试。')
          }
        } else {
          throw new Error(errorData?.error?.message || '翻译服务不可用。')
        }
      }

      const data: ChatGPTResponse = await response.json()
      const result = data.choices[0].message.content.trim()
      translationResult.value = result
      status.value = '完成'
      
      // 重置重试计数器
      retryCount.value = 0
      
      return result
    } catch (err) {
      console.error('Translation error:', err)
      
      // 根据错误类型设置错误信息
      if (err instanceof Error) {
        error.value = { message: err.message }
      } else {
        error.value = { message: '翻译失败，请稍后再试。' }
      }
      
      status.value = '错误'
      // 重置重试计数器
      retryCount.value = 0
      
      return null
    }
  }
  
  return {
    translationResult,
    status,
    error,
    translate
  }
}

/**
 * useTranslation函数返回值类型定义
 */
export interface UseTranslationReturn {
  /** 翻译结果 */
  translationResult: Ref<string>
  /** 翻译状态 */
  status: Ref<TranslationStatus>
  /** 翻译错误信息 */
  error: Ref<TranslationError | null>
  /** 执行翻译的函数 */
  translate: (inputText: string, sourceLanguage: string, targetLanguage: string) => Promise<string | null>
}
