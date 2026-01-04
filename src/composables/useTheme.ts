import { ref, Ref, onMounted } from 'vue'

// 主题类型定义
export type ThemeType = 'light' | 'dark'

// 本地存储主题偏好的键名
const THEME_STORAGE_KEY = 'themePreference'

export const useTheme = () => {
  // 主题状态管理
  const currentTheme: Ref<ThemeType> = ref('light')
  
  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    saveThemeToLocalStorage()
    applyTheme()
  }
  
  // 保存主题偏好到localStorage
  const saveThemeToLocalStorage = () => {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme.value)
  }
  
  // 从localStorage加载主题偏好
  const loadThemeFromLocalStorage = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && (saved === 'light' || saved === 'dark')) {
      currentTheme.value = saved
    } else {
      // 如果没有保存的主题偏好，使用系统主题
      currentTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  }
  
  // 应用主题到页面
  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  }
  
  // 监听系统主题变化
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      // 只有在用户没有明确设置主题偏好时，才跟随系统主题变化
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        currentTheme.value = mediaQuery.matches ? 'dark' : 'light'
        applyTheme()
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }
  
  // 初始化主题
  onMounted(() => {
    loadThemeFromLocalStorage()
    applyTheme()
    setupSystemThemeListener()
  })
  
  return {
    currentTheme,
    toggleTheme,
    applyTheme
  }
}

export type UseThemeReturn = ReturnType<typeof useTheme>