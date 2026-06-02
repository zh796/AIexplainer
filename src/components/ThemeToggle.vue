<script setup lang="ts">
/**
 * 主题切换组件 — 四主题循环
 * 霓虹 / 浅色 / 深色 / 羊皮纸
 */
import { useTutorialStore } from '../stores/tutorialStore'
import type { Theme } from '../types'

const store = useTutorialStore()

const themes: { key: Theme; label: string; icon: string }[] = [
  { key: 'neon', label: '霓虹', icon: '💠' },
  { key: 'light', label: '浅色', icon: '☀️' },
  { key: 'dark', label: '深色', icon: '🌙' },
  { key: 'sepia', label: '护眼', icon: '📜' },
]

function cycleTheme(): void {
  const currentIndex = themes.findIndex(t => t.key === store.state.theme)
  const nextIndex = (currentIndex + 1) % themes.length
  store.setTheme(themes[nextIndex].key)
}
</script>

<template>
  <button
    @click="cycleTheme"
    class="btn-ghost text-sm gap-1.5"
    aria-label="切换主题"
  >
    <span>{{ themes.find(t => t.key === store.state.theme)?.icon }}</span>
    <span class="hidden sm:inline">{{ themes.find(t => t.key === store.state.theme)?.label }}</span>
  </button>
</template>
