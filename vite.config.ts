import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],

  // ====== GitHub Pages 部署配置 ======
  // 用户/组织站点 (username.github.io): base 设为 '/'
  // 项目站点 (username.github.io/repo-name): base 设为 '/repo-name/'
  base: '/AIexplainer/',

  build: {
    // 输出目录（GitHub Pages 默认用 docs/ 或根目录）
    outDir: 'dist',
    // 生成 sourcemap 方便调试（部署时可改为 false）
    sourcemap: false,
    // CSS 代码分割
    cssCodeSplit: false,
  },
})
