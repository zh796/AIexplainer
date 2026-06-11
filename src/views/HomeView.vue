<script setup lang="ts">
import { ref, computed } from "vue"
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
const showApiKeyModal = ref(false)

const hasKey = computed(() => !!store.state.apiKey)

function onStartLearning() {
  if (!hasKey.value) {
    showApiKeyModal.value = true
    return
  }
  router.push("/learn")
}

function onExplore() {
  const exploreEl = document.getElementById("ai-explore-section")
  if (exploreEl) {
    exploreEl.scrollIntoView({ behavior: "smooth" })
  }
}

function onApiKeySaved() {
  showApiKeyModal.value = false
  router.push("/learn")
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto overflow-x-hidden bg-bg" id="home-scroller">
    <HeroSection
      :has-key="hasKey"
      @open-saves="showSavePanel = true"
      @explore="onExplore"
      @start-learning="onStartLearning"
      @open-api-key="showApiKeyModal = true"
    />

    <section id="ai-explore-section" class="border-t border-border">
      <ExploreMode
        :inline="true"
        @start-learning="onStartLearning"
        @back-home="() => {}"
      />
    </section>

    <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    <ApiKeyInput
      v-if="showApiKeyModal"
      @close="showApiKeyModal = false"
      @saved="onApiKeySaved"
    />
    <OnboardingHint />
  </div>
</template>
