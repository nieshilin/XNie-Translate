import { ref, Ref } from 'vue'

// 语言选项接口定义
export interface LanguageOption {
  code: string;
  name: string;
}

// 语言偏好接口定义
export interface LanguagePreferences {
  source: string;
  target: string;
}

// 本地存储语言偏好的键名
const LANGUAGE_STORAGE_KEY = 'languagePreferences'

export const useLanguage = () => {
  // 语言选项定义
  const languages: LanguageOption[] = [
    { code: 'auto', name: '自动识别' },
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英文' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' }
  ]
  
  // 语言状态管理
  const sourceLanguage: Ref<string> = ref('zh')
  const targetLanguage: Ref<string> = ref('en')
  
  // 保存语言偏好到localStorage
  const saveLanguagePreferences = (): void => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify({
      source: sourceLanguage.value,
      target: targetLanguage.value
    }))
  }
  
  // 从localStorage加载语言偏好
  const loadLanguagePreferences = (): void => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved) {
      try {
        const preferences: LanguagePreferences = JSON.parse(saved)
        if (preferences.source) sourceLanguage.value = preferences.source
        if (preferences.target) targetLanguage.value = preferences.target
      } catch (error) {
        console.error('Failed to parse language preferences:', error)
      }
    }
  }
  
  // 获取语言名称
  const getLanguageName = (code: string): string => {
    const language = languages.find(lang => lang.code === code)
    return language ? language.name : code
  }
  
  // 初始化时加载语言偏好
  loadLanguagePreferences()
  
  return {
    languages,
    sourceLanguage,
    targetLanguage,
    saveLanguagePreferences,
    loadLanguagePreferences,
    getLanguageName
  }
}

export type UseLanguageReturn = ReturnType<typeof useLanguage>
