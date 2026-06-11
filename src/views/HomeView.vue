<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import HeroSection from "../components/HeroSection.vue"
import ExploreMode from "../components/ExploreMode.vue"
import ApiKeyInput from "../components/ApiKeyInput.vue"
import OnboardingHint from "../components/OnboardingHint.vue"
import FileBrowser from "../components/FileBrowser.vue"
import { useTutorialStore } from "../stores/tutorialStore"

const router = useRouter()
const store = useTutorialStore()
const showSavePanel = ref(false)

function onStartLearning() {
  router.push("/learn")
}

function onExplore() {
  const exploreEl = document.getElementById("ai-explore-section")
  if (exploreEl) {
    exploreEl.scrollIntoView({ behavior: "smooth" })
  }
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto overflow-x-hidden bg-bg" id="home-scroller">
    <div v-if="!store.state.apiKey" class="min-h-full flex items-center justify-center">
      <ApiKeyInput />
    </div>

    <template v-else>
      <HeroSection
        @open-saves="showSavePanel = true"
        @explore="onExplore"
        @start-learning="onStartLearning"
      />

      <section id="ai-explore-section" class="border-t border-border">
        <ExploreMode
          :inline="true"
          @start-learning="onStartLearning"
          @back-home="() => {}"
        />
      </section>
    </template>

    <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    <OnboardingHint />
  </div>
</template>