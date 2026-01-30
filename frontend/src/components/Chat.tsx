import { Loader2, Send, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import type { ChatMessage } from "@/lib/api"
import { chatApi } from "@/lib/api"
import { cn } from "@/lib/utils"

import { UpgradeBanner } from "./UpgradeBanner"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface ChatProps {
  materialId: string
  materialTitle: string
}

export function ChatComponent({ materialId, materialTitle }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [materialId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadHistory = async () => {
    setIsFetching(true)
    setAccessDenied(false)
    try {
      const history = await chatApi.getHistory(materialId)
      setMessages(history)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load chat history"
      if (errorMessage.includes("CHAT_ACCESS_DENIED") || errorMessage.includes("Pro feature")) {
        setAccessDenied(true)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsFetching(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      material_id: materialId,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await chatApi.send(materialId, userMessage)
      // Replace temp message with real ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        response.user_message,
        response.assistant_message,
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message")
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm("Clear all chat history for this material?")) return
    try {
      await chatApi.clear(materialId)
      setMessages([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear history")
    }
  }

  if (isFetching) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    )
  }

  if (accessDenied) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <UpgradeBanner variant="chat" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Discuss: {materialTitle}</CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4">
              <div>
                <p className="font-medium">Start a conversation</p>
                <p className="text-sm mt-1">
                  Ask questions about the material, request explanations, or discuss topics
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive py-2">{error}</p>
        )}

        {/* Input form */}
        <form onSubmit={sendMessage} className="flex gap-2 pt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the material..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
