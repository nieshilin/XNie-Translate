<template>
  <div class="app-container">
    <div class="navbar">
    <div class="logo">XNie Translate</div>
    <div class="actions">
      <button @click="handleImport" title="导入文本文件">📁</button>
      <button @click="toggleTheme">
        {{ currentTheme === 'light' ? '🌙' : '☀️' }}
      </button>
    </div>
  </div>
  
  <!-- 错误提示组件 -->
  <ErrorMessage
    v-if="showError"
    :message="errorMessage"
    :type="errorType"
    :show="showError"
    :autoClose="true"
    :duration="5000"
    @close="showError = false"
  />

    <div class="main">
      <div class="panel input">
        <div class="panel-header">
           <span>输入</span>
           <div class="header-actions">
             <select v-model="sourceLanguage" class="language-select">
               <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                 {{ lang.name }}
               </option>
             </select>
             <div class="formatting-tools">
               <button @click="formatText('trim')" title="去除多余空格">✂️</button>
               <button @click="formatText('newlines')" title="添加段落换行">↵</button>
               <button @click="formatText('plaintext')" title="转换为纯文本">📝</button>
             </div>
           </div>
         </div>
        <textarea
          id="input"
          v-model="inputText"
          placeholder="请输入翻译文本"
          @keydown.ctrl.enter="translate"
          @keydown.meta.enter="translate"
          @keydown.esc="clearText"
          aria-label="输入要翻译的文本"
          aria-describedby="input-hint"
        ></textarea>
        <div id="input-hint" class="sr-only">按 Cmd / Ctrl + Enter 翻译，按 Esc 清空</div>
      </div>

      <div class="panel">
        <div class="panel-header">
           <span>输出</span>
           <div class="header-actions">
             <select v-model="targetLanguage" class="language-select">
               <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                 {{ lang.name }}
               </option>
             </select>
             <button class="copy-btn" @click="copyToClipboard" :disabled="!translationResult" :class="{ 'copy-success': copySuccess }" title="复制到剪贴板">
               {{ copySuccess ? '✅' : '📋' }}
             </button>
             <button class="export-btn" @click="handleExport" :disabled="!translationResult" title="导出为文本文件">
               💾
             </button>
             <button class="speak-btn" @click="speakTranslation" :disabled="!translationResult" title="听翻译结果">🔊</button>
           </div>
         </div>
        <div 
          id="output" 
          class="output" 
          :class="{ empty: !translationResult }" 
          aria-label="翻译结果" 
          aria-live="polite"
          contenteditable
          v-if="!isLoading"
          @input="handleTranslationEdit"
        >
          {{ translationResult || '翻译结果将显示在这里' }}
        </div>
        <div v-else class="output loading-container" aria-label="翻译中">
          <div class="loading-animation" aria-live="assertive">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="loading-text">{{ status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录区域 -->
    <div class="history-container">
      <div class="history-header">
        <span>最近翻译</span>
        <button class="clear-btn" @click="clearHistory" :disabled="historyRecords.length === 0">
          清空全部
        </button>
      </div>
      <div class="history-list" v-if="historyRecords.length > 0">
        <div 
          v-for="item in historyRecords" 
          :key="item.id" 
          class="history-item"
          @click="loadFromHistory(item)"
        >
          <div class="history-item-input">{{ item.input }}</div>
          <div class="history-item-output">{{ item.output }}</div>
          <div class="history-item-time">{{ formatTime(item.timestamp) }}</div>
        </div>
      </div>
      <div class="history-empty" v-else>
        暂无翻译历史
      </div>
    </div>

    <div class="footer">
      <span>AI翻译引擎</span>
      <span id="status" aria-live="polite">{{ status }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useTranslation } from './composables/useTranslation'
import { useHistory } from './composables/useHistory'
import { useLanguage } from './composables/useLanguage'
import { useAutoSave } from './composables/useAutoSave'
import { useTheme } from './composables/useTheme'
import { useFileIO } from './composables/useFileIO'
import ErrorMessage from './components/ErrorMessage.vue'

/**
 * XNie Translate 主应用组件
 * 提供实时翻译、历史记录、自动保存、主题切换等功能
 */

// 状态管理
const inputText = ref('')
const copySuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')
const errorType = ref<'error' | 'warning' | 'info' | 'success'>('error')
const isLoading = ref(false)

// 使用组合式函数
const { 
  translationResult, 
  status, 
  error, 
  translate 
} = useTranslation()

const { 
  historyRecords, 
  saveToHistory, 
  loadFromHistory, 
  clearHistory, 
  formatTime 
} = useHistory()

const { 
  languages, 
  sourceLanguage, 
  targetLanguage, 
  saveLanguagePreferences 
} = useLanguage()

const { 
  loadAutoSavedInput, 
  saveAutoSavedInput, 
  clearAutoSavedInput 
} = useAutoSave()

const { 
  currentTheme, 
  toggleTheme 
} = useTheme()

const { 
  importTextFile, 
  exportTextFile 
} = useFileIO()

/**
 * 清空输入文本和自动保存
 */
const clearText = () => {
  inputText.value = ''
  clearAutoSavedInput()
}

/**
 * 导入文本文件并设置到输入框
 */
const handleImport = async () => {
  try {
    const content = await importTextFile()
    if (content) {
      inputText.value = content
    }
  } catch (error) {
    console.error('Failed to import file:', error)
  }
}

/**
 * 导出翻译结果为文本文件
 */
const handleExport = () => {
  if (!translationResult.value) return
  
  // 生成文件名，包含当前时间
  const now = new Date()
  const filename = `翻译结果_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.txt`
  
  // 导出文本文件
  exportTextFile(translationResult.value, filename)
}

/**
 * 将翻译结果复制到剪贴板
 */
const copyToClipboard = async () => {
  if (!translationResult.value) return
  
  try {
    await navigator.clipboard.writeText(translationResult.value)
    copySuccess.value = true
    
    // 2秒后恢复原样
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

/**
 * 处理翻译结果编辑
 * @param e - 编辑事件
 */
const handleTranslationEdit = (e: Event) => {
  const target = e.target as HTMLElement
  translationResult.value = target.innerText || ''
}

// 监听状态变化以更新isLoading
watch(status, (newStatus) => {
  isLoading.value = newStatus === '翻译中…' || newStatus.startsWith('重试中')
})

/**
 * 文本格式化功能
 * @param type - 格式化类型
 *   - trim: 去除多余空格和换行符
 *   - newlines: 添加段落换行
 *   - plaintext: 转换为纯文本
 */
const formatText = (type: 'trim' | 'newlines' | 'plaintext') => {
  let formattedText = inputText.value
  
  switch (type) {
    case 'trim':
      // 去除多余的空格和换行符
      formattedText = formattedText
        .replace(/\s+/g, ' ') // 将连续的空格、制表符、换行符替换为单个空格
        .trim() // 去除首尾空格
      break
    
    case 'newlines':
      // 将连续的空格转换为换行符，创建段落
      formattedText = formattedText
        .replace(/\s{2,}/g, '\n\n') // 将两个或更多空格替换为段落分隔符
        .replace(/\n{3,}/g, '\n\n') // 确保最多只有两个连续换行符
        .trim()
      break
    
    case 'plaintext':
      // 移除所有HTML标签，转换为纯文本
      formattedText = formattedText
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/&nbsp;/g, ' ') // 替换HTML空格
        .replace(/&lt;/g, '<') // 替换HTML转义字符
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim()
      break
  }
  
  // 更新输入文本
  inputText.value = formattedText
}

/**
 * 翻译结果发音功能
 * 使用Web Speech API朗读翻译结果
 */
const speakTranslation = () => {
  if (!translationResult.value) return
  
  // 检查浏览器是否支持Web Speech API
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(translationResult.value)
    
    // 根据目标语言设置语音
    utterance.lang = targetLanguage.value
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    // 播放语音
    speechSynthesis.speak(utterance)
  } else {
    // 不支持Web Speech API时显示错误
    showError.value = true
    errorMessage.value = '您的浏览器不支持文本朗读功能'
    errorType.value = 'warning'
  }
}

/**
 * 自定义翻译函数，包含历史记录保存
 */
const customTranslate = async () => {
  if (!inputText.value.trim()) return
  
  const result = await translate(inputText.value, sourceLanguage.value, targetLanguage.value)
  if (result) {
    // 保存到历史记录
    saveToHistory(inputText.value, result)
  }
}

/**
 * 创建防抖版本的自定义翻译函数
 * 防止频繁调用翻译API
 */
const debouncedCustomTranslate = (() => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return () => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      customTranslate()
      timeout = null
    }, 500)
  }
})()

// 监听输入变化，实现自动翻译和自动保存
watch(inputText, (newValue) => {
  // 自动保存输入内容
  saveAutoSavedInput(newValue)
  
  if (newValue.trim()) {
    debouncedCustomTranslate()
  } else {
    // 清空输出
    translationResult.value = ''
  }
})

// 监听语言变化并保存
watch([sourceLanguage, targetLanguage], () => {
  saveLanguagePreferences()
  // 如果有输入内容，自动重新翻译
  if (inputText.value.trim()) {
    debouncedCustomTranslate()
  }
})

// 监听错误状态变化
watch(error, (newError) => {
  if (newError) {
    showError.value = true
    errorMessage.value = newError.message
    errorType.value = 'error'
  }
}, { deep: true })

// 监听状态变化，处理不同状态
watch(status, (newStatus) => {
  if (newStatus === '错误') {
    // 错误状态由error监听器处理
    return
  } else if (newStatus.startsWith('重试中')) {
    // 重试中状态可以显示警告提示
    showError.value = true
    errorMessage.value = newStatus
    errorType.value = 'warning'
  } else if (newStatus === '完成' && translationResult.value) {
    // 翻译成功，可以显示简短的成功提示
    showError.value = true
    errorMessage.value = '翻译完成'
    errorType.value = 'success'
  }
})

// 键盘快捷键
onMounted(() => {
  // 加载自动保存的输入内容
  const savedInput = loadAutoSavedInput()
  if (savedInput) {
    inputText.value = savedInput
  }
  
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      const textarea = document.getElementById('input') as HTMLTextAreaElement
      textarea?.focus()
    }
  })
})
</script>

<style>
/* 默认浅色主题 */
:root {
  --primary: #475569;
  --bg: #FFFFFF;
  --panel: #FFFFFF;
  --text: #1E293B;
  --muted: #64748B;
  --border: #CBD5E1;
  --shadow: 0 2px 8px rgba(0,0,0,.04);
  --shadow-hover: 0 4px 16px rgba(0,0,0,.06);
  --border-radius: 8px;
  --error: #DC2626;
  --success: #16A34A;
  --hover: #F1F5F9;
}

/* 深色主题 */
[data-theme="dark"] {
  --primary: #94A3B8;
  --bg: #0F172A;
  --panel: #1E293B;
  --text: #F1F5F9;
  --muted: #94A3B8;
  --border: #334155;
  --shadow: 0 2px 8px rgba(0,0,0,.2);
  --shadow-hover: 0 4px 16px rgba(0,0,0,.3);
  --error: #FCA5A5;
  --success: #6EE7B7;
  --hover: #334155;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  display: flex;
  flex-direction: column;
  line-height: 1.5;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== App Container ===== */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
}

/* ===== Navbar ===== */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 20px;
}

.logo {
  font-weight: 600;
  font-size: 20px;
  color: var(--text);
  letter-spacing: -0.01em;
}

.actions button {
  background: var(--panel);
  border: 1px solid var(--border);
  cursor: pointer;
  opacity: .7;
  margin-left: 12px;
  font-size: 18px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.actions button:hover {
  opacity: 1;
  box-shadow: 0 4px 12px rgba(0,0,0,.06);
  transform: translateY(-1px);
}

.actions button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

/* ===== Main Content ===== */
.main {
  flex: 1;
  display: flex;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* ===== Panels ===== */
.panel {
  flex: 1;
  background: var(--panel);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  transition: border-color 0.2s ease;
}

.panel:hover {
  border-color: var(--primary);
}

.panel-header {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 16px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.formatting-tools {
  display: flex;
  gap: 4px;
}

.formatting-tools button {
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  opacity: .7;
  font-size: 14px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.formatting-tools button:hover {
  opacity: 1;
  background: var(--bg);
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.language-select {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.language-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.1);
}

.copy-btn, .export-btn, .speak-btn {
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  opacity: .7;
  font-size: 16px;
  width: 40px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: all 0.2s ease;
}

.copy-btn:hover:not(:disabled), .export-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--bg);
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.copy-btn:disabled, .export-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

/* ===== Input ===== */
textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 18px;
  line-height: 1.7;
  background: transparent;
  color: var(--text);
  width: 100%;
  transition: all 0.2s ease;
  padding: 12px;
  border-radius: 8px;
  font-family: inherit;
}

textarea:focus {
  background: rgba(100, 116, 139, 0.04);
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.2);
}

/* ===== Output ===== */
.output {
  font-size: 18px;
  line-height: 1.7;
  white-space: pre-wrap;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
  outline: none;
}

.output[contenteditable] {
  cursor: text;
  border: 1px solid transparent;
}

.output[contenteditable]:focus {
  background: rgba(100, 116, 139, 0.04);
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.2);
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty {
  color: var(--muted);
  margin-top: 20px;
  animation: none;
}

.copy-success {
  opacity: 1;
}

/* ===== Loading Animation ===== */
.loading-animation {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  padding: 20px 0;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background-color: var(--muted);
  border-radius: 50%;
  animation: loading 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-text {
  font-size: 16px;
  color: var(--muted);
}

@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* ===== Footer ===== */
.footer {
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
  padding: 0 20px;
  margin-top: 30px;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .main {
    flex-direction: column;
    gap: 20px;
  }
  
  .app-container {
    padding: 10px;
  }
  
  .navbar {
    margin-bottom: 20px;
    padding: 0 10px;
  }
  
  .logo {
    font-size: 20px;
  }
  
  .actions button {
    margin-left: 8px;
    font-size: 16px;
    width: 36px;
    height: 36px;
  }
  
  .panel {
    padding: 16px;
    border-radius: 12px;
  }
  
  .panel-header {
    font-size: 13px;
    margin-bottom: 12px;
  }
  
  textarea,
  .output {
    font-size: 16px;
    line-height: 1.6;
    padding: 10px;
  }
  
  .footer {
    padding: 0 10px;
    font-size: 11px;
    margin-top: 20px;
  }
}

/* ===== History ===== */
.history-container {
  max-width: 1400px;
  margin: 20px auto 0;
  width: 100%;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 20px;
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}

.clear-btn {
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
  opacity: .7;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: var(--muted);
}

.clear-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--bg);
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.clear-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 0 20px;
}

.history-item {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: var(--primary);
}

.history-item-input {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 8px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-output {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-time {
  font-size: 12px;
  color: var(--muted);
  opacity: .8;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  font-size: 14px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .app-container {
    padding: 8px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .panel {
    padding: 12px;
  }
  
  textarea,
  .output {
    font-size: 15px;
  }
  
  .history-container {
    margin-top: 15px;
  }
  
  .history-header,
  .history-list {
    padding: 0 10px;
  }
  
  .history-item {
    padding: 12px;
  }
}
</style>