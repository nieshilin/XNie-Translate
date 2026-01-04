import { ref, Ref } from 'vue'

// 历史记录项接口定义
export interface TranslationHistoryItem {
  id: string;
  input: string;
  output: string;
  timestamp: Date;
}

// 本地存储历史记录的键名
const HISTORY_STORAGE_KEY = 'translationHistory'

export const useHistory = () => {
  const historyRecords: Ref<TranslationHistoryItem[]> = ref([])
  
  // 格式化时间
  const formatTime = (date: Date | number | string): string => {
    const dateObj = new Date(date)
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`
  }
  
  // 从localStorage加载历史记录
  const loadHistoryFromLocalStorage = (): void => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 将字符串日期转换回Date对象
        historyRecords.value = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      } catch (error) {
        console.error('Failed to parse translation history:', error)
        historyRecords.value = []
      }
    }
  }
  
  // 保存历史记录到localStorage
  const saveHistoryToLocalStorage = (): void => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRecords.value))
  }
  
  // 保存新的翻译记录
  const saveToHistory = (input: string, output: string): void => {
    if (!input.trim() || !output.trim()) return
    
    const historyItem: TranslationHistoryItem = {
      id: Date.now().toString(),
      input,
      output,
      timestamp: new Date()
    }
    
    // 添加到历史记录列表的开头
    historyRecords.value.unshift(historyItem)
    
    // 限制历史记录数量不超过50条
    if (historyRecords.value.length > 50) {
      historyRecords.value = historyRecords.value.slice(0, 50)
    }
    
    // 保存到localStorage
    saveHistoryToLocalStorage()
  }
  
  // 从历史记录加载翻译
  const loadFromHistory = (item: TranslationHistoryItem): { input: string; output: string } => {
    return {
      input: item.input,
      output: item.output
    }
  }
  
  // 清空历史记录
  const clearHistory = (): void => {
    historyRecords.value = []
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }
  
  // 初始化时加载历史记录
  loadHistoryFromLocalStorage()
  
  return {
    historyRecords,
    saveToHistory,
    loadFromHistory,
    clearHistory,
    formatTime
  }
}

export type UseHistoryReturn = ReturnType<typeof useHistory>
