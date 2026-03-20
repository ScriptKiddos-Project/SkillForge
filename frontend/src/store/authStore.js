import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isDemo: false,

      setAuth: (user, access_token) => {
        const wasDemo = useAuthStore.getState().isDemo  // check if coming from demo
        localStorage.setItem('sf_token', access_token)
        localStorage.removeItem('skillforge-pathway')
        set({ user, token: access_token, isDemo: false })
        if (wasDemo) window.location.href = '/dashboard'  // force full reload
      },
      setDemo: (user, token) => {
        localStorage.setItem('sf_token', token)
        set({ user, token, isDemo: true })
      },
      logout: () => {
        localStorage.removeItem('sf_token')
        localStorage.removeItem('skillforge-auth')
        set({ user: null, token: null, isDemo: false })
      },
      isAuthenticated: () => {
        const state = get()
        return !!(state.user && state.token)
      },
    }),
    {
      name: 'skillforge-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isDemo: state.isDemo }),
    }
  )
)