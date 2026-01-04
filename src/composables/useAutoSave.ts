import { ref, Ref } from 'vue'

// 本地存储自动保存的键名
const AUTO_SAVE_STORAGE_KEY = 'autoSavedInput'

export const useAutoSave = () => {
  // 自动保存的输入内容
  const autoSavedInput: Ref<string> = ref('')
  
  // 从localStorage加载自动保存的输入内容
  const loadAutoSavedInput = (): string => {
    const saved = localStorage.getItem(AUTO_SAVE_STORAGE_KEY)
    if (saved) {
      autoSavedInput.value = saved
      return saved
    }
    return ''
  }
  
  // 保存输入内容到自动保存
  const saveAutoSavedInput = (content: string): void => {
    if (content === undefined) return
    autoSavedInput.value = content
    localStorage.setItem(AUTO_SAVE_STORAGE_KEY, content)
  }
  
  // 清除自动保存的输入内容
  const clearAutoSavedInput = (): void => {
    autoSavedInput.value = ''
    localStorage.removeItem(AUTO_SAVE_STORAGE_KEY)
  }
  
  return {
    autoSavedInput,
    loadAutoSavedInput,
    saveAutoSavedInput,
    clearAutoSavedInput
  }
}

export type UseAutoSaveReturn = ReturnType<typeof useAutoSave>
