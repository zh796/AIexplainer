import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

// GitHub Pages SPA 回退恢复：404.html 将原始 URL 保存到 sessionStorage，
// 此处读取并恢复到 vue-router，确保 OAuth 回调等深层链接正常工作
router.isReady().then(() => {
  const saved = sessionStorage.getItem('redirect')
  if (!saved) return
  sessionStorage.removeItem('redirect')
  try {
    const url = new URL(saved)
    const target = url.pathname + url.search + url.hash
    // 去掉 base path 前缀转为 vue-router 内部路径
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const routePath = base && target.startsWith(base)
      ? target.slice(base.length) || '/'
      : target
    if (routePath !== router.currentRoute.value.fullPath) {
      router.replace(routePath)
    }
  } catch { /* URL 无效则忽略 */ }
})
