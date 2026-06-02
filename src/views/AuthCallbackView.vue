<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()

onMounted(async () => {
  const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
  if (error) {
    console.error('[Auth Callback] OAuth 回调失败:', error.message)
    router.replace('/login')
  } else {
    router.replace('/')
  }
})
</script>

<template>
  <div class="h-full flex items-center justify-center">
    <div class="text-center">
      <div class="text-2xl mb-3">⏳</div>
      <p class="text-fg-muted text-sm">正在完成登录...</p>
    </div>
  </div>
</template>
