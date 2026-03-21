import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePathwayStore } from './pathwayStore'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isDemo: false,

      setAuth: (user, access_token) => {
        localStorage.setItem("sf_token", access_token);
        localStorage.removeItem("skillforge-pathway"); // clear persisted pathway for new user
        set({ user, token: access_token, isDemo: false });
        // clear pathway store in memory too
        const { clearPathway } = usePathwayStore.getState();
        clearPathway();
      },
      logout: () => {
        localStorage.removeItem("sf_token");
        localStorage.removeItem("skillforge-auth");
        localStorage.removeItem("skillforge-pathway");
        set({ user: null, token: null, isDemo: false });
        const { clearPathway } = usePathwayStore.getState();
        clearPathway();
      },
      setDemo: (user, token) => {
        localStorage.setItem("sf_token", token);
        set({ user, token, isDemo: true });
      },
      isAuthenticated: () => {
        const state = get();
        return !!(state.user && state.token);
      },
    }),
    {
      name: "skillforge-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isDemo: state.isDemo,
      }),
    },
  ),
);
