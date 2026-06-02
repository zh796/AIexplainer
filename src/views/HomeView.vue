<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import HeroSection from '../components/HeroSection.vue'
import ApiKeyInput from '../components/ApiKeyInput.vue'
import FileBrowser from '../components/FileBrowser.vue'
import { useTutorialStore } from '../stores/tutorialStore'

const router = useRouter()
const store = useTutorialStore()
const showSavePanel = ref(false)

function onExplore() {
  router.push('/explore')
}

function onStartLearning() {
  router.push('/learn')
}
</script>

<template>
  <div class="h-full w-full flex flex-col relative">
    <div v-if="!store.state.apiKey" class="flex-1 relative z-10">
      <ApiKeyInput />
    </div>
    <template v-else>
      <HeroSection
        @open-saves="showSavePanel = true"
        @explore="onExplore"
        @start-learning="onStartLearning"
      />
      <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    </template>
  </div>
</template>
