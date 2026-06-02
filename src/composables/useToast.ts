/**
 * useToast — 轻量通知系统
 *
 * 全局单例 toast 队列，自动消失。
 * 使用: const toast = useToast(); toast.show('消息', 'success')
 */
import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function show(message: string, type: ToastType = 'info', duration = 3000): void {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

function success(message: string): void { show(message, 'success') }
function error(message: string): void { show(message, 'error', 5000) }
function info(message: string): void { show(message, 'info') }
function warning(message: string): void { show(message, 'warning', 4000) }

export function useToast() {
  return {
    toasts: readonly(toasts),
    show,
    success,
    error,
    info,
    warning,
  }
}
