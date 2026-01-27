import { useState } from "react"

import type { Flashcard as FlashcardType } from "@/lib/api"
import { hapticFeedback } from "@/lib/telegram"
import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

interface FlashcardProps {
  card: FlashcardType
  onReview?: (quality: "forgot" | "know") => void
  showActions?: boolean
}

export function Flashcard({ card, onReview, showActions = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    hapticFeedback("light")
  }

  const handleReview = (quality: "forgot" | "know") => {
    hapticFeedback(quality === "know" ? "success" : "warning")
    onReview?.(quality)
    setIsFlipped(false)
  }

  const stageLabels: Record<number, string> = {
    0: "New",
    1: "Learning",
    2: "Learning",
    3: "Review",
    4: "Review",
    5: "Mastered",
  }

  const stageColors: Record<number, string> = {
    0: "bg-blue-100 text-blue-800",
    1: "bg-yellow-100 text-yellow-800",
    2: "bg-yellow-100 text-yellow-800",
    3: "bg-orange-100 text-orange-800",
    4: "bg-orange-100 text-orange-800",
    5: "bg-green-100 text-green-800",
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={cn("flip-card cursor-pointer", isFlipped && "flipped")}
        onClick={handleFlip}
        style={{ height: "300px" }}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <Card className="flip-card-front h-full">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full mb-4",
                  stageColors[Math.min(card.learning_stage, 5)]
                )}
              >
                {stageLabels[Math.min(card.learning_stage, 5)]}
              </span>
              <h2 className="text-3xl font-bold text-center mb-2">{card.term}</h2>
              {card.grammar_note && (
                <p className="text-sm text-muted-foreground italic">
                  {card.grammar_note}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                Tap to reveal
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card className="flip-card-back h-full overflow-auto">
            <CardContent className="flex flex-col h-full p-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{card.translation}</h3>
                {card.definition && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {card.definition}
                  </p>
                )}
                {card.context_original && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm italic">"{card.context_original}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review actions */}
      {showActions && isFlipped && onReview && (
        <div className="flex gap-4 mt-6 justify-center">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleReview("forgot")}
          >
            Forgot
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleReview("know")}
          >
            Know it
          </Button>
        </div>
      )}
    </div>
  )
}
