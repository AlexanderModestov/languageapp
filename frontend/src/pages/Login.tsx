import { BookOpen, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signInWithGoogle } from "@/lib/supabase"

export function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md animate-scale-in relative">
        <CardHeader className="text-center pb-2">
          <div
            className="flex justify-center mb-6 animate-fade-down"
            style={{ animationDelay: "100ms" }}
          >
            <div className="relative">
              <div className="p-4 rounded-2xl bg-primary/10">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <CardTitle
            className="text-2xl sm:text-3xl font-bold tracking-tight animate-fade-up"
            style={{ animationDelay: "150ms" }}
          >
            Welcome to LinguaMind
          </CardTitle>

          <CardDescription
            className="text-base mt-3 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Learn English through content you love. Import YouTube videos and documents
            to build your vocabulary with AI-powered flashcards.
          </CardDescription>
        </CardHeader>

        <CardContent
          className="space-y-5 pt-4 animate-fade-up"
          style={{ animationDelay: "250ms" }}
        >
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900 animate-fade-up">
              {error}
            </div>
          )}

          <Button
            className="w-full h-12 text-base font-medium hover-scale"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
