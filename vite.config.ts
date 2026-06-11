import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    outDir: "dist",
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/mermaid")) return "mermaid-vendor"
          if (id.includes("node_modules/gsap")) return "gsap-vendor"
          if (id.includes("node_modules/@supabase")) return "supabase-vendor"
          if (id.includes("node_modules/dexie")) return "dexie-vendor"
        },
      },
    },
  },
})