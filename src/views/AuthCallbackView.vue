<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()
const route = useRoute()

const status = ref<'loading' | 'error' | 'success'>('loading')
const errorMsg = ref('')

onMounted(async () => {
  // 从当前 URL 或 sessionStorage 中提取 auth code
  let authCode: string | null = null

  // 优先从当前路由 query 或 URL 中获取 code
  const currentCode = route.query.code as string
  if (currentCode) {
    authCode = Array.isArray(currentCode) ? currentCode[0] : currentCode
  } else {
    // 尝试从当前 location.href 解析
    const params = new URL(window.location.href).searchParams
    authCode = params.get('code')
  }

  // 如果当前 URL 没有 code，尝试从 sessionStorage 恢复
  if (!authCode) {
    const saved = sessionStorage.getItem('redirect')
    if (saved) {
      sessionStorage.removeItem('redirect')
      try {
        const savedUrl = new URL(saved)
        authCode = savedUrl.searchParams.get('code')
        if (authCode) {
          // 恢复 URL 到地址栏，确保后续 state 一致
          await router.replace(savedUrl.pathname + savedUrl.search + savedUrl.hash)
        }
      } catch { /* URL 解析失败，忽略 */ }
    }
  }

  if (!authCode) {
    status.value = 'error'
    errorMsg.value = '未在回调 URL 中找到授权码 (code)'
    setTimeout(() => router.replace('/login'), 4000)
    return
  }

  // 仅传递 code 值（而非完整 URL），这是 Supabase API 的要求
  const { error } = await supabase.auth.exchangeCodeForSession(authCode)

  if (error) {
    status.value = 'error'
    errorMsg.value = error.message
    console.error('[Auth Callback] exchangeCodeForSession 失败:', error)
    setTimeout(() => router.replace('/login'), 4000)
  } else {
    status.value = 'success'
    router.replace('/')
  }
})
</script>

<template>
  <div class="h-full flex items-center justify-center">
    <div class="text-center max-w-sm">
      <!-- 加载中 -->
      <template v-if="status === 'loading'">
        <div class="text-2xl mb-3">⏳</div>
        <p class="text-fg-muted text-sm">正在完成登录...</p>
      </template>

      <!-- 失败 -->
      <template v-else-if="status === 'error'">
        <div class="text-2xl mb-3">❌</div>
        <p class="text-error text-sm font-medium mb-2">登录回调失败</p>
        <p class="text-fg-muted text-xs mb-4 break-all">{{ errorMsg }}</p>
        <p class="text-fg-subtle text-xs">即将跳转到登录页...</p>
      </template>

      <!-- 成功 -->
      <template v-else>
        <div class="text-2xl mb-3">✅</div>
        <p class="text-fg-muted text-sm">登录成功，正在跳转...</p>
      </template>
    </div>
  </div>
</template>
