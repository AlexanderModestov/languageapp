import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { materialsApi } from "@/lib/api"

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: materialsApi.list,
  })
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ["materials", id],
    queryFn: () => materialsApi.get(id),
    enabled: !!id,
  })
}

export function useMaterialStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ["materials", id, "status"],
    queryFn: () => materialsApi.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.processing_status
      // Stop polling when completed or failed
      if (status === "completed" || status === "failed") {
        return false
      }
      return 2000 // Poll every 2 seconds while processing
    },
  })
}

export function useUploadYouTube() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title, url }: { title: string; url: string }) =>
      materialsApi.uploadYouTube(title, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title, file }: { title: string; file: File }) =>
      materialsApi.uploadFile(title, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
  })
}

export function useProcessMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => materialsApi.process(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["materials", id] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => materialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
  })
}
