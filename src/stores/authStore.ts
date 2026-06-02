import { reactive, computed } from 'vue'
import { supabase } from '../services/supabase'
import type { User, Session } from '@supabase/supabase-js'

const state = reactive({
  user: null as User | null,
  session: null as Session | null,
  loading: true,
  error: null as string | null,
})

supabase.auth.onAuthStateChange((_event, session) => {
  state.session = session
  state.user = session?.user ?? null
  state.loading = false
})

supabase.auth.getSession().then(({ data: { session } }) => {
  state.session = session
  state.user = session?.user ?? null
  state.loading = false
})

const isLoggedIn = computed(() => !!state.user)
const displayName = computed(() => {
  if (!state.user) return ''
  return state.user.user_metadata?.full_name
    || state.user.user_metadata?.name
    || state.user.email?.split('@')[0]
    || '用户'
})
const avatarUrl = computed(() => {
  if (!state.user) return ''
  return state.user.user_metadata?.avatar_url || ''
})

async function signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  state.error = null
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    state.error = error.message
    return { success: false, error: error.message }
  }
  return { success: true }
}

async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  state.error = null
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    state.error = error.message
    return { success: false, error: error.message }
  }
  return { success: true }
}

async function signInWithGitHub(): Promise<{ success: boolean; error?: string }> {
  state.error = null
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  })
  if (error) {
    state.error = error.message
    return { success: false, error: error.message }
  }
  return { success: true }
}

async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  state.error = null
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) {
    state.error = error.message
    return { success: false, error: error.message }
  }
  return { success: true }
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut()
  state.user = null
  state.session = null
}

async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export function useAuthStore() {
  return {
    state,
    isLoggedIn,
    displayName,
    avatarUrl,
    signUp,
    signIn,
    signInWithGitHub,
    signInWithGoogle,
    signOut,
    resetPassword,
  }
}
