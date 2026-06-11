<script setup lang="ts">
import { useRouter } from "vue-router"
import ExploreMode from "../components/ExploreMode.vue"
import { useTutorialStore } from "../stores/tutorialStore"

const router = useRouter()
const store = useTutorialStore()

function onStartLearning(concept: string) {
  if (concept) {
    store.state.conceptInput = concept
    store.startGeneration()
  }
  router.push("/learn")
}

function onBackHome() {
  store.resetToHome()
  router.push("/")
}
</script>

<template>
  <div class="h-full w-full flex flex-col bg-bg">
    <ExploreMode
      :inline="false"
      @start-learning="onStartLearning"
      @back-home="onBackHome"
    />
  </div>
</template>