import { ArrowLeft, CheckCircle, Loader2, Trophy } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Flashcard } from "@/components/Flashcard"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useReviewCard, useReviewCards } from "@/hooks/useCards"

function SessionStats({
  reviewed,
  correct,
}: {
  reviewed: number
  correct: number
}) {
  const percentage = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0

  return (
    <div className="bg-secondary/50 p-5 rounded-xl w-full animate-fade-up">
      <h3 className="font-semibold mb-3">Session Stats</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cards reviewed</span>
          <span className="font-semibold">{reviewed}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Correct</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {correct} ({percentage}%)
          </span>
        </div>
      </div>
    </div>
  )
}

export function Study() {
  const { data: cards, isLoading, refetch } = useReviewCards()
  const reviewCard = useReviewCard()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 })

  const currentCard = cards?.[currentIndex]
  const remainingCards = cards ? cards.length - currentIndex : 0
  const progress = cards && cards.length > 0 ? (currentIndex / cards.length) * 100 : 0

  const handleReview = async (quality: "forgot" | "know") => {
    if (!currentCard) return

    try {
      await reviewCard.mutateAsync({ id: currentCard.id, quality })

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: quality === "know" ? prev.correct + 1 : prev.correct,
      }))

      if (currentIndex < (cards?.length ?? 0) - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        refetch()
        setCurrentIndex(0)
      }
    } catch (error) {
      console.error("Failed to review card:", error)
    }
  }

  const handleStartNew = () => {
    setSessionStats({ reviewed: 0, correct: 0 })
    setCurrentIndex(0)
    refetch()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading cards...</p>
        </div>
      </Layout>
    )
  }

  // No cards to review
  if (!cards || cards.length === 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto animate-scale-in">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950 mb-4">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                You have no cards due for review right now. Come back later or add more
                content to study.
              </p>

              {sessionStats.reviewed > 0 && (
                <div className="w-full mb-6">
                  <SessionStats
                    reviewed={sessionStats.reviewed}
                    correct={sessionStats.correct}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Link to="/">
                  <Button variant="outline" className="hover-scale">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleStartNew} className="hover-scale">
                  Check for more
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  // Session complete
  if (currentIndex >= cards.length && sessionStats.reviewed > 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto animate-scale-in">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950 mb-4">
                <Trophy className="h-12 w-12 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>

              <div className="w-full my-6">
                <SessionStats
                  reviewed={sessionStats.reviewed}
                  correct={sessionStats.correct}
                />
              </div>

              <div className="flex gap-3">
                <Link to="/">
                  <Button variant="outline" className="hover-scale">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleStartNew} className="hover-scale">
                  Continue Studying
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-down">
          <Link to="/">
            <Button variant="ghost" size="icon" className="hover-scale">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold">Study Session</h1>
            <p className="text-sm text-muted-foreground">
              {remainingCards} card{remainingCards !== 1 ? "s" : ""} remaining
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div
          className="h-2 bg-secondary rounded-full overflow-hidden animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Card */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          {currentCard && (
            <Flashcard
              card={currentCard}
              onReview={handleReview}
              showActions={true}
            />
          )}
        </div>

        {/* Session Stats */}
        {sessionStats.reviewed > 0 && (
          <div
            className="text-center text-sm text-muted-foreground animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            Session: {sessionStats.correct}/{sessionStats.reviewed} correct
          </div>
        )}
      </div>
    </Layout>
  )
}
