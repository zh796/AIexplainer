<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleRegister(): Promise<void> {
  if (!email.value.trim() || !password.value || !confirmPassword.value) {
    errorMsg.value = '请填写所有字段'
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = '密码至少 6 位'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  const { success, error } = await auth.signUp(email.value.trim(), password.value)
  loading.value = false
  if (success) {
    successMsg.value = '注册成功！请查收邮箱验证链接，验证后即可登录。'
  } else {
    errorMsg.value = error || '注册失败'
  }
}

async function handleGitHub(): Promise<void> {
  loading.value = true
  errorMsg.value = ''
  const { success, error } = await auth.signInWithGitHub()
  loading.value = false
  if (!success && error) {
    errorMsg.value = error
  }
}

async function handleGoogle(): Promise<void> {
  loading.value = true
  errorMsg.value = ''
  const { success, error } = await auth.signInWithGoogle()
  loading.value = false
  if (!success && error) {
    errorMsg.value = error
  }
}
</script>

<template>
  <div class="h-full flex items-center justify-center p-6">
    <div
      class="w-full max-w-md p-8 rounded-2xl bg-bg-card border border-border shadow-sm animate-fade-in-scale"
    >
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-fg mb-2" style="font-family:var(--font-display,inherit)">
          AI <span class="text-primary">Explainer</span>
        </h1>
        <p class="text-sm text-fg-muted">创建账号，开始你的 AI 学习之旅</p>
      </div>

      <div class="flex flex-col gap-3 mb-6">
        <button
          @click="handleGitHub"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border
                 bg-bg-elevated text-fg text-sm font-medium transition-all duration-200
                 hover:bg-bg-card hover:border-fg-subtle cursor-pointer
                 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          使用 GitHub 注册
        </button>

        <button
          @click="handleGoogle"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border
                 bg-bg-elevated text-fg text-sm font-medium transition-all duration-200
                 hover:bg-bg-card hover:border-fg-subtle cursor-pointer
                 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          使用 Google 注册
        </button>
      </div>

      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 h-px bg-border"></div>
        <span class="text-xs text-fg-subtle">或使用邮箱</span>
        <div class="flex-1 h-px bg-border"></div>
      </div>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <div v-if="errorMsg" class="px-3 py-2 rounded-lg bg-error/10 text-error text-xs">
          {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="px-3 py-2 rounded-lg bg-success/10 text-success text-xs">
          {{ successMsg }}
        </div>

        <input
          v-model="email"
          type="email"
          placeholder="邮箱地址"
          autocomplete="email"
          class="w-full px-4 py-3 rounded-lg border text-sm transition-all duration-200
                 bg-bg border-border text-fg placeholder:text-fg-subtle
                 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码（至少 6 位）"
            autocomplete="new-password"
            class="w-full px-4 py-3 rounded-lg border text-sm transition-all duration-200
                   bg-bg border-border text-fg placeholder:text-fg-subtle
                   focus:border-primary focus:ring-2 focus:ring-primary/20 pr-12"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer text-fg-muted hover:text-fg"
          >
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>

        <input
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="确认密码"
          autocomplete="new-password"
          class="w-full px-4 py-3 rounded-lg border text-sm transition-all duration-200
                 bg-bg border-border text-fg placeholder:text-fg-subtle
                 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-fg-muted">
        已有账号？
        <router-link to="/login" class="text-primary hover:underline">立即登录</router-link>
      </p>
    </div>
  </div>
</template>
