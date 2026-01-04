import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { useHistory } from './useHistory'

describe('useHistory', () => {
  // 保存原始localStorage
  const originalLocalStorage = localStorage

  beforeEach(() => {
    // 清除localStorage
    localStorage.clear()
    // 清除所有模拟
    vi.clearAllMocks()
  })

  afterAll(() => {
    // 恢复原始localStorage
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage })
  })

  it('should initialize with empty history', () => {
    const { historyRecords } = useHistory()
    
    expect(historyRecords.value).toEqual([])
  })

  it('should save translation to history', () => {
    const { historyRecords, saveToHistory } = useHistory()
    const mockInput = '你好'
    const mockOutput = 'Hello'
    
    saveToHistory(mockInput, mockOutput)
    
    expect(historyRecords.value).toHaveLength(1)
    expect(historyRecords.value[0].input).toBe(mockInput)
    expect(historyRecords.value[0].output).toBe(mockOutput)
    expect(historyRecords.value[0].id).toBeDefined()
    expect(historyRecords.value[0].timestamp).toBeDefined()
  })

  it('should load history from localStorage', () => {
    // 预先在localStorage中设置历史记录
    const mockHistory = [
      {
        id: '1',
        input: '你好',
        output: 'Hello',
        timestamp: Date.now() - 1000
      },
      {
        id: '2',
        input: '再见',
        output: 'Goodbye',
        timestamp: Date.now()
      }
    ]
    
    localStorage.setItem('translationHistory', JSON.stringify(mockHistory))
    
    const { historyRecords } = useHistory()
    
    expect(historyRecords.value).toHaveLength(2)
    expect(historyRecords.value[0].id).toBe('1')
    expect(historyRecords.value[0].input).toBe('你好')
    expect(historyRecords.value[0].output).toBe('Hello')
    expect(historyRecords.value[1].id).toBe('2')
    expect(historyRecords.value[1].input).toBe('再见')
    expect(historyRecords.value[1].output).toBe('Goodbye')
  })

  it('should limit history to 50 items', () => {
    const { historyRecords, saveToHistory } = useHistory()
    
    // 添加51条记录
    for (let i = 0; i < 51; i++) {
      saveToHistory(`输入${i}`, `输出${i}`)
    }
    
    expect(historyRecords.value).toHaveLength(50)
    expect(historyRecords.value[0].input).toBe('输入50') // 最新的记录应该在开头
    expect(historyRecords.value[49].input).toBe('输入1') // 第1条记录应该在第50位
  })

  it('should clear history', () => {
    const { historyRecords, saveToHistory, clearHistory } = useHistory()
    
    saveToHistory('你好', 'Hello')
    saveToHistory('再见', 'Goodbye')
    
    expect(historyRecords.value).toHaveLength(2)
    
    clearHistory()
    
    expect(historyRecords.value).toEqual([])
    expect(localStorage.getItem('translationHistory')).toBeNull()
  })

  it('should format time correctly', () => {
    const { formatTime } = useHistory()
    const timestamp = new Date('2023-10-01T14:30:45').getTime()
    
    const formattedTime = formatTime(timestamp)
    
    expect(formattedTime).toBe('2023-10-01 14:30:45')
  })
})
