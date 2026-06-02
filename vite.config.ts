import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],

  // ====== 动态部署配置 ======
  // 本地开发: base = '/'
  // GitHub Pages: base = '/AIexplainer/' (通过环境变量设置)
  base: process.env.VITE_BASE_PATH || '/',

  build: {
    // 输出目录（GitHub Pages 默认用 docs/ 或根目录）
    outDir: 'dist',
    // 生成 sourcemap 方便调试（部署时可改为 false）
    sourcemap: false,
    // CSS 代码分割
    cssCodeSplit: false,
  },
})
