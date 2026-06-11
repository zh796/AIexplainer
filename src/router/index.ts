import { createRouter, createWebHistory } from "vue-router"
import type { RouteRecordRaw } from "vue-router"
import { supabase } from "../services/supabase"

const routes: RouteRecordRaw[] = [
  { path: "/login", name: "login", component: () => import("../views/LoginView.vue"), meta: { guest: true } },
  { path: "/register", name: "register", component: () => import("../views/RegisterView.vue"), meta: { guest: true } },
  { path: "/auth/callback", name: "auth-callback", component: () => import("../views/AuthCallbackView.vue") },
  { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
  { path: "/explore", name: "explore", component: () => import("../views/ExploreView.vue") },
  { path: "/learn", name: "learn", component: () => import("../views/LearnView.vue"), meta: { requiresAuth: true } },
  { path: "/api-key", name: "api-key", component: () => import("../views/ApiKeyView.vue"), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), routes,
})

router.beforeEach(async (to, _from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: "login", query: { redirect: to.fullPath } })
  } else if (to.meta.guest && isLoggedIn) {
    next({ name: "home" })
  } else {
    next()
  }
})

export default router