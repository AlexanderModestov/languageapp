import type { User } from "@supabase/supabase-js"
import { create } from "zustand"

import { supabase } from "@/lib/supabase"

type AuthState = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      // Get initial session
      const { data } = await supabase.auth.getSession()
      set({
        user: data.session?.user ?? null,
        isAuthenticated: !!data.session?.user,
        isLoading: false,
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
        })
      })
    } catch (error) {
      console.error("Failed to initialize auth:", error)
      set({ isLoading: false })
    }
  },

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
}))
