import { useEffect } from "react"

import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const { user, isLoading, isAuthenticated, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    user,
    isLoading,
    isAuthenticated,
  }
}
