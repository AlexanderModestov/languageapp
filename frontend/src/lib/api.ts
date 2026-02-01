import { getAccessToken } from "./supabase"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

type FetchOptions = RequestInit & {
  params?: Record<string, string>
}

async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error("Not authenticated")
  }

  const { params, ...fetchOptions } = options
  let url = `${API_URL}/api/v1${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(error.detail || "Request failed")
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

// Auth API
export const authApi = {
  getMe: () => fetchWithAuth("/auth/me"),
}

// Materials API
export type Material = {
  id: string
  user_id: string
  title: string
  source_type: "youtube" | "file" | "url"
  source_url: string | null
  file_path: string | null
  processed_text: string | null
  processing_status: "pending" | "processing" | "completed" | "failed"
  created_at: string
}

export type MaterialWithFlashcards = Material & {
  flashcards: Flashcard[]
}

export const materialsApi = {
  list: (): Promise<Material[]> => fetchWithAuth("/materials"),

  get: (id: string): Promise<MaterialWithFlashcards> =>
    fetchWithAuth(`/materials/${id}`),

  getStatus: (id: string): Promise<{ id: string; processing_status: string }> =>
    fetchWithAuth(`/materials/${id}/status`),

  uploadYouTube: (title: string, url: string): Promise<Material> =>
    fetchWithAuth("/materials/upload/youtube", {
      method: "POST",
      body: JSON.stringify({ title, url }),
    }),

  uploadFile: async (title: string, file: File): Promise<Material> => {
    const token = await getAccessToken()
    if (!token) throw new Error("Not authenticated")

    const formData = new FormData()
    formData.append("title", title)
    formData.append("file", file)

    const response = await fetch(`${API_URL}/api/v1/materials/upload/file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }))
      throw new Error(error.detail || "Upload failed")
    }

    return response.json()
  },

  process: (id: string): Promise<{ message: string; material_id: string }> =>
    fetchWithAuth(`/materials/${id}/process`, { method: "POST" }),

  delete: (id: string): Promise<null> =>
    fetchWithAuth(`/materials/${id}`, { method: "DELETE" }),
}

// Flashcards API
export type Flashcard = {
  id: string
  material_id: string
  user_id: string
  term: string
  translation: string
  definition: string | null
  context_original: string | null
  grammar_note: string | null
  learning_stage: number
  next_review_at: string
  created_at: string
}

export type ReviewStats = {
  total_cards: number
  due_for_review: number
  new_cards: number
  learning: number
  mastered: number
}

export const cardsApi = {
  getReviewCards: (limit = 20): Promise<Flashcard[]> =>
    fetchWithAuth("/cards/review", { params: { limit: String(limit) } }),

  reviewCard: (
    id: string,
    quality: "forgot" | "know"
  ): Promise<{ id: string; learning_stage: number; next_review_at: string }> =>
    fetchWithAuth(`/cards/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ quality }),
    }),

  list: (materialId?: string): Promise<Flashcard[]> =>
    fetchWithAuth("/cards", {
      params: materialId ? { material_id: materialId } : undefined,
    }),

  getStats: (): Promise<ReviewStats> => fetchWithAuth("/cards/stats"),
}

// Quiz API
export type QuizOption = {
  text: string
  is_correct: boolean
}

export type QuizQuestion = {
  question: string
  question_type: "multiple_choice" | "true_false" | "fill_blank"
  options: QuizOption[]
  correct_answer: string
  explanation: string
}

export type Quiz = {
  id: string
  material_id: string
  questions: QuizQuestion[]
  score: number | null
  total_questions: number
  completed_at: string | null
  created_at: string
}

export type QuizResult = {
  quiz_id: string
  score: number
  total_questions: number
  results: {
    question_index: number
    question: string
    user_answer: string
    correct_answer: string
    is_correct: boolean
    explanation: string
  }[]
}

export const quizzesApi = {
  create: (materialId: string, numQuestions = 5): Promise<Quiz> =>
    fetchWithAuth("/quizzes", {
      method: "POST",
      body: JSON.stringify({ material_id: materialId, num_questions: numQuestions }),
    }),

  list: (materialId: string): Promise<Quiz[]> =>
    fetchWithAuth(`/quizzes/material/${materialId}`),

  get: (quizId: string): Promise<Quiz> =>
    fetchWithAuth(`/quizzes/${quizId}`),

  submit: (quizId: string, answers: string[]): Promise<QuizResult> =>
    fetchWithAuth(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  delete: (quizId: string): Promise<null> =>
    fetchWithAuth(`/quizzes/${quizId}`, { method: "DELETE" }),
}

// Chat API
export type ChatMessage = {
  id: string
  material_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export type ChatResponse = {
  user_message: ChatMessage
  assistant_message: ChatMessage
}

export const chatApi = {
  getHistory: (materialId: string): Promise<ChatMessage[]> =>
    fetchWithAuth(`/chat/${materialId}`),

  send: (materialId: string, message: string): Promise<ChatResponse> =>
    fetchWithAuth(`/chat/${materialId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  clear: (materialId: string): Promise<null> =>
    fetchWithAuth(`/chat/${materialId}`, { method: "DELETE" }),
}

// Subscription API
export type SubscriptionStatus = "free" | "trialing" | "active" | "past_due" | "canceled"

export type Subscription = {
  status: SubscriptionStatus
  tier: "free" | "pro"
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  uploads_this_week: number
  upload_limit: number
  quizzes_per_material_limit: number
  week_reset_at: string
}

export type CheckoutSession = {
  checkout_url: string
  session_id: string
}

export const subscriptionApi = {
  get: (): Promise<Subscription> =>
    fetchWithAuth("/payments/subscription"),

  createCheckoutSession: (): Promise<CheckoutSession> =>
    fetchWithAuth("/payments/create-checkout-session", { method: "POST" }),

  cancel: (): Promise<Subscription> =>
    fetchWithAuth("/payments/cancel", { method: "POST" }),

  reactivate: (): Promise<Subscription> =>
    fetchWithAuth("/payments/reactivate", { method: "POST" }),
}
