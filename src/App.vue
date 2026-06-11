<script setup lang="ts">
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "./stores/authStore"
import ThemeToggle from "./components/ThemeToggle.vue"
import UserMenu from "./components/UserMenu.vue"
import ToastContainer from "./components/ToastContainer.vue"

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const showAppShell = computed(() => {
  return !["login", "register", "auth-callback"].includes(route.name as string)
})

function navigateTo(path: string): void {
  if (route.path === path) return
  router.push(path)
}
</script>

<template>
  <div class="h-full w-full flex flex-col relative bg-bg">
    <header
      v-if="showAppShell"
      class="app-nav sticky top-0 z-30 shrink-0 border-b border-border/50"
    >
      <div class="app-nav-inner">
        <div class="app-nav-brand">
          <router-link to="/" class="app-nav-title">
            AI <span class="app-nav-title-accent">Explainer</span>
          </router-link>
        </div>

        <nav class="app-nav-links">
          <button class="app-nav-link" @click="navigateTo('/')">功能介绍</button>
          <button class="app-nav-link" @click="navigateTo('/explore')">使用帮助</button>
          <ThemeToggle />
          <UserMenu v-if="auth.isLoggedIn" />
          <router-link v-else to="/login" class="app-nav-link">登录</router-link>
        </nav>
      </div>
    </header>

    <main class="flex-1 relative overflow-hidden flex flex-col">
      <router-view />
    </main>

    <ToastContainer />
  </div>
</template>

<style scoped>
.app-nav {
  background: color-mix(in oklab, var(--color-bg) 82%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.app-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1.1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.app-nav-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-fg);
  text-decoration: none;
  transition: color 0.2s ease;
}

.app-nav-title-accent {
  background: linear-gradient(135deg, #00e8ff, #8a5cff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-nav-links {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.app-nav-link {
  background: transparent;
  border: 0;
  color: var(--color-fg-muted);
  font-size: 0.92rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.app-nav-link:hover {
  color: var(--color-fg);
  background: var(--color-bg-elevated);
}
</style>
