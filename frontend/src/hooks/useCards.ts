import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { cardsApi } from "@/lib/api"

export function useReviewCards(limit = 20) {
  return useQuery({
    queryKey: ["cards", "review"],
    queryFn: () => cardsApi.getReviewCards(limit),
  })
}

export function useReviewCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quality }: { id: string; quality: "forgot" | "know" }) =>
      cardsApi.reviewCard(id, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", "review"] })
      queryClient.invalidateQueries({ queryKey: ["cards", "stats"] })
    },
  })
}

export function useCards(materialId?: string) {
  return useQuery({
    queryKey: ["cards", { materialId }],
    queryFn: () => cardsApi.list(materialId),
  })
}

export function useCardStats() {
  return useQuery({
    queryKey: ["cards", "stats"],
    queryFn: cardsApi.getStats,
  })
}
