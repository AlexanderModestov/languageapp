import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { subscriptionApi } from "@/lib/api"

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.get,
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
