<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useTutorialStore } from '../stores/tutorialStore'

const router = useRouter()
const auth = useAuthStore()
const store = useTutorialStore()
const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const avatarSrc = computed(() => auth.avatarUrl.value)
const userName = computed(() => auth.displayName.value)
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

function handleSignOut() {
  open.value = false
  auth.signOut()
  router.push('/login')
}

function goToApiKey() {
  open.value = false
  router.push('/api-key')
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      @click="open = !open"
      class="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200
             hover:bg-bg-elevated cursor-pointer"
    >
      <div
        v-if="avatarSrc"
        class="w-7 h-7 rounded-full bg-primary/20 overflow-hidden"
      >
        <img :src="avatarSrc" :alt="userName" class="w-full h-full object-cover" />
      </div>
      <div
        v-else
        class="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold"
      >
        {{ userInitial }}
      </div>
      <span class="text-xs text-fg-muted hidden sm:inline max-w-[80px] truncate">
        {{ userName }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-56 rounded-xl bg-bg-card border border-border shadow-lg py-2 z-50"
      >
        <div class="px-4 py-2 border-b border-border">
          <p class="text-sm font-medium text-fg truncate">{{ userName }}</p>
          <p class="text-xs text-fg-subtle truncate">{{ auth.state.user?.email }}</p>
        </div>

        <button
          @click="goToApiKey"
          class="w-full text-left px-4 py-2 text-sm text-fg-muted hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          🔑 API Key 配置
        </button>

        <button
          v-if="store.state.apiKey"
          @click="store.clearApiKey(); goToApiKey()"
          class="w-full text-left px-4 py-2 text-sm text-fg-muted hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          🔄 更换 API Key
        </button>

        <div class="h-px bg-border my-1"></div>

        <button
          @click="handleSignOut"
          class="w-full text-left px-4 py-2 text-sm text-error hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          退出登录
        </button>
      </div>
    </Transition>
  </div>
</template>
