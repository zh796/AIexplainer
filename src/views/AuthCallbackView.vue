<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()
const route = useRoute()

const status = ref<'loading' | 'error' | 'success'>('loading')
const errorMsg = ref('')

onMounted(async () => {
  // 优先使用当前 URL 中的 auth code 参数
  let targetUrl = window.location.href

  // 如果当前 URL 不含 code，尝试从 sessionStorage 恢复
  if (!route.query.code && !new URL(targetUrl).searchParams.has('code')) {
    const saved = sessionStorage.getItem('redirect')
    if (saved) {
      const savedUrl = new URL(saved)
      if (savedUrl.searchParams.has('code')) {
        targetUrl = saved
        sessionStorage.removeItem('redirect')
        // 用完整 URL 替换当前路由，让 code 出现在地址栏
        await router.replace(savedUrl.pathname + savedUrl.search + savedUrl.hash)
        targetUrl = window.location.href
      }
    }
  }

  const { error } = await supabase.auth.exchangeCodeForSession(targetUrl)

  if (error) {
    status.value = 'error'
    errorMsg.value = error.message
    console.error('[Auth Callback] exchangeCodeForSession 失败:', error)
    // 3 秒后跳转到登录页
    setTimeout(() => router.replace('/login'), 3000)
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
