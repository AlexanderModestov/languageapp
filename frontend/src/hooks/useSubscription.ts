import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/useAuth"
import { subscriptionApi } from "@/lib/api"

export function useSubscription() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.get,
    enabled: isAuthenticated,
  })
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: subscriptionApi.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subscriptionApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] })
    },
  })
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subscriptionApi.reactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] })
    },
  })
}
