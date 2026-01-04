<script setup lang="ts">
import { computed, onUnmounted } from 'vue'

// 定义组件的props
const props = defineProps<{
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
  show?: boolean
  autoClose?: boolean
  duration?: number
}>()

// 定义emit事件
const emit = defineEmits<{
  (e: 'close'): void
}>()

// 计算错误提示的样式类
const errorClass = computed(() => {
  return {
    'error-message': true,
    [`error-message--${props.type}`]: true,
    'error-message--show': props.show
  }
})

// 关闭错误提示
const closeError = () => {
  emit('close')
}

// 自动关闭功能
if (props.show && props.autoClose) {
  const timer = setTimeout(() => {
    closeError()
  }, props.duration || 3000)
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearTimeout(timer)
  })
}
</script>

<template>
  <div :class="errorClass" role="alert" aria-live="assertive">
    <div class="error-message__content">
      <span class="error-message__icon">
        {{ type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️' }}
      </span>
      <span class="error-message__text">{{ message }}</span>
    </div>
    <button class="error-message__close" @click="closeError" aria-label="关闭提示">
      ✕
    </button>
  </div>
</template>

<style scoped>
.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s ease;
  z-index: 1000;
  border: 1px solid transparent;
}

.error-message--show {
  opacity: 1;
  transform: translateY(0);
}

.error-message--error {
  background-color: rgba(253, 224, 224, 0.95);
  border-color: #FCA5A5;
  color: #B91C1C;
}

.error-message--warning {
  background-color: rgba(254, 243, 199, 0.95);
  border-color: #FCD34D;
  color: #92400E;
}

.error-message--info {
  background-color: rgba(219, 234, 254, 0.95);
  border-color: #93C5FD;
  color: #1E40AF;
}

.error-message--success {
  background-color: rgba(220, 252, 231, 0.95);
  border-color: #86EFAC;
  color: #15803D;
}

.error-message__content {
  display: flex;
  align-items: center;
}

.error-message__icon {
  margin-right: 8px;
  font-size: 18px;
}

.error-message__text {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.error-message__close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.7;
  margin-left: 12px;
  padding: 0;
  color: inherit;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.error-message__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.05);
}

/* 深色主题适配 */
[data-theme="dark"] .error-message--error {
  background-color: rgba(185, 28, 28, 0.8);
  border-color: #DC2626;
  color: #FEE2E2;
}

[data-theme="dark"] .error-message--warning {
  background-color: rgba(146, 64, 14, 0.8);
  border-color: #F59E0B;
  color: #FEF3C7;
}

[data-theme="dark"] .error-message--info {
  background-color: rgba(30, 64, 175, 0.8);
  border-color: #3B82F6;
  color: #DBEAFE;
}

[data-theme="dark"] .error-message--success {
  background-color: rgba(21, 128, 61, 0.8);
  border-color: #22C55E;
  color: #D1FAE5;
}
</style>