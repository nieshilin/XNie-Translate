

/**
 * 文件导入/导出功能组合式函数
 * 提供文本文件的导入和导出功能
 */
export const useFileIO = () => {
  /**
   * 导入文本文件
   * @returns Promise<string | null> - 返回导入的文本内容，导入失败或取消时返回null
   */
  const importTextFile = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      // 创建一个隐藏的文件输入元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt'
      
      // 监听文件选择事件
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        
        if (!file) {
          resolve(null)
          return
        }
        
        // 读取文件内容
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          resolve(content)
        }
        
        reader.onerror = () => {
          resolve(null)
        }
        
        reader.readAsText(file, 'utf-8')
      }
      
      // 触发文件选择对话框
      input.click()
    })
  }
  
  /**
   * 导出文本文件
   * @param content - 要导出的文本内容
   * @param filename - 导出的文件名，默认值为'translation.txt'
   */
  const exportTextFile = (content: string, filename: string = 'translation.txt'): void => {
    if (!content) return
    
    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }
  
  return {
    importTextFile,
    exportTextFile
  }
}

/**
 * useFileIO返回值类型定义
 */
export type UseFileIOReturn = {
  /** 导入文本文件函数 */
  importTextFile: () => Promise<string | null>
  /** 导出文本文件函数 */
  exportTextFile: (content: string, filename?: string) => void
}