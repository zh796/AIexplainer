<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CardRenderer from '../components/CardRenderer.vue'
import FileBrowser from '../components/FileBrowser.vue'
import { useTutorialStore } from '../stores/tutorialStore'

const router = useRouter()
const store = useTutorialStore()
const showSavePanel = ref(false)

function onOpenSaves() {
  showSavePanel.value = true
}

watch(
  () => store.hasPages || store.state.isLoading,
  (hasContentOrLoading) => {
    if (!hasContentOrLoading && !store.state.error) {
      router.replace('/')
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="h-full w-full flex flex-col relative">
    <template v-if="store.state.isLoading && !store.hasPages">
      <div class="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div class="relative">
          <div class="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <div class="text-center">
          <p class="text-lg font-semibold text-fg mb-1">正在生成教程...</p>
          <p class="text-sm text-fg-muted">{{ store.state.conceptInput }}</p>
        </div>
        <div v-if="store.hasPages" class="text-xs text-fg-subtle">
          已生成 {{ store.state.pages.length }} 页
        </div>
      </div>
    </template>

    <template v-else-if="store.state.error && !store.hasPages">
      <div class="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <span class="text-4xl">⚠️</span>
        <div class="text-center">
          <p class="text-lg font-semibold text-error mb-1">生成失败</p>
          <p class="text-sm text-fg-muted max-w-md">{{ store.state.error }}</p>
        </div>
        <button @click="router.replace('/')" class="btn-primary mt-2">返回首页</button>
      </div>
    </template>

    <template v-else-if="store.hasPages">
      <CardRenderer @open-saves="onOpenSaves" />
      <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    </template>
  </div>
</template>
