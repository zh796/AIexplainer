<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import UserMenu from './components/UserMenu.vue'
import ToastContainer from './components/ToastContainer.vue'

const route = useRoute()
const auth = useAuthStore()

const showAppShell = computed(() => {
  return auth.isLoggedIn && !['login', 'register', 'auth-callback'].includes(route.name as string)
})
</script>

<template>
  <div class="h-full w-full flex flex-col relative bg-bg">
    <header
      v-if="showAppShell"
      class="flex items-center justify-between px-4 py-2 z-30 shrink-0
             bg-bg/80 backdrop-blur-sm border-b border-border"
    >
      <div class="flex items-center gap-3">
        <router-link
          to="/"
          class="text-sm font-bold text-fg hover:text-primary transition-colors"
          style="font-family:var(--font-display,inherit)"
        >
          AI <span class="text-primary">Explainer</span>
        </router-link>
      </div>

      <div class="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>

    <main class="flex-1 relative overflow-hidden flex flex-col">
      <router-view />
    </main>

    <ToastContainer />
  </div>
</template>
