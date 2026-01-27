import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Flashcard } from "@/components/Flashcard"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useReviewCard, useReviewCards } from "@/hooks/useCards"

export function Study() {
  const { data: cards, isLoading, refetch } = useReviewCards()
  const reviewCard = useReviewCard()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 })

  const currentCard = cards?.[currentIndex]
  const remainingCards = cards ? cards.length - currentIndex : 0

  const handleReview = async (quality: "forgot" | "know") => {
    if (!currentCard) return

    try {
      await reviewCard.mutateAsync({ id: currentCard.id, quality })

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: quality === "know" ? prev.correct + 1 : prev.correct,
      }))

      // Move to next card
      if (currentIndex < (cards?.length ?? 0) - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Session complete - refetch to check for more cards
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  // No cards to review
  if (!cards || cards.length === 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
              <p className="text-muted-foreground text-center mb-6">
                You have no cards due for review right now. Come back later or add more
                content to study.
              </p>

              {sessionStats.reviewed > 0 && (
                <div className="bg-muted p-4 rounded-lg mb-6 w-full">
                  <h3 className="font-medium mb-2">Session Stats</h3>
                  <div className="flex justify-between text-sm">
                    <span>Cards reviewed:</span>
                    <span className="font-medium">{sessionStats.reviewed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Correct:</span>
                    <span className="font-medium text-green-600">
                      {sessionStats.correct} (
                      {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}
                      %)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleStartNew}>Check for more</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  // Session complete (reviewed all cards)
  if (currentIndex >= cards.length && sessionStats.reviewed > 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>

              <div className="bg-muted p-4 rounded-lg mb-6 w-full">
                <h3 className="font-medium mb-2">Session Stats</h3>
                <div className="flex justify-between text-sm">
                  <span>Cards reviewed:</span>
                  <span className="font-medium">{sessionStats.reviewed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Correct:</span>
                  <span className="font-medium text-green-600">
                    {sessionStats.correct} (
                    {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleStartNew}>Continue Studying</Button>
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
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold">Study Session</h1>
            <p className="text-sm text-muted-foreground">
              {remainingCards} cards remaining
            </p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Progress */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex) / cards.length) * 100}%`,
            }}
          />
        </div>

        {/* Current Card */}
        {currentCard && (
          <Flashcard
            card={currentCard}
            onReview={handleReview}
            showActions={true}
          />
        )}

        {/* Session Stats */}
        {sessionStats.reviewed > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Session: {sessionStats.correct}/{sessionStats.reviewed} correct
          </div>
        )}
      </div>
    </Layout>
  )
}
