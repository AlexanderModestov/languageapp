import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { useState } from "react"

import type { Quiz, QuizResult } from "@/lib/api"
import { quizzesApi } from "@/lib/api"
import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

interface QuizProps {
  materialId: string
  onClose: () => void
}

export function QuizComponent({ materialId, onClose }: QuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQuiz = async (numQuestions: number) => {
    setIsGenerating(true)
    setError(null)
    try {
      const newQuiz = await quizzesApi.create(materialId, numQuestions)
      setQuiz(newQuiz)
      setAnswers(new Array(newQuiz.questions.length).fill(""))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const submitQuiz = async () => {
    if (!quiz) return
    setIsLoading(true)
    try {
      const quizResult = await quizzesApi.submit(quiz.id, answers)
      setResult(quizResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit quiz")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial state - choose number of questions
  if (!quiz && !isGenerating) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generate Quiz</CardTitle>
          <CardDescription>
            Test your understanding of the material
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Choose the number of questions:
          </p>
          <div className="flex gap-2">
            {[3, 5, 10].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => generateQuiz(num)}
              >
                {num} Questions
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full mt-4">
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Generating quiz
  if (isGenerating) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating quiz questions...</p>
        </CardContent>
      </Card>
    )
  }

  // Show results
  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            You scored {result.score} out of {result.total_questions}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <span className="text-4xl font-bold">
              {Math.round((result.score / result.total_questions) * 100)}%
            </span>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {result.results.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-lg border",
                  r.is_correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}
              >
                <div className="flex items-start gap-2">
                  {r.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{r.question}</p>
                    <p className="text-sm mt-1">
                      Your answer: <span className={r.is_correct ? "text-green-700" : "text-red-700"}>{r.user_answer}</span>
                    </p>
                    {!r.is_correct && (
                      <p className="text-sm text-green-700">
                        Correct answer: {r.correct_answer}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {r.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setQuiz(null); setResult(null); setAnswers([]); }} className="flex-1">
              Take Another Quiz
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Quiz in progress
  if (!quiz) return null

  const question = quiz.questions[currentQuestion]
  const isLastQuestion = currentQuestion === quiz.questions.length - 1
  const canProceed = answers[currentQuestion] !== ""

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {quiz.questions.length}
        </CardTitle>
        <CardDescription>
          {question.question_type === "multiple_choice" && "Select the correct answer"}
          {question.question_type === "true_false" && "True or False?"}
          {question.question_type === "fill_blank" && "Fill in the blank"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>

        {question.question_type === "multiple_choice" && (
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option.text)}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-colors",
                  answers[currentQuestion] === option.text
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {question.question_type === "true_false" && (
          <div className="flex gap-2">
            {["True", "False"].map((option) => (
              <Button
                key={option}
                variant={answers[currentQuestion] === option ? "default" : "outline"}
                onClick={() => handleAnswer(option)}
                className="flex-1"
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {question.question_type === "fill_blank" && (
          <input
            type="text"
            value={answers[currentQuestion]}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}

        <div className="flex gap-2 pt-4">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              Previous
            </Button>
          )}
          <div className="flex-1" />
          {isLastQuestion ? (
            <Button
              onClick={submitQuiz}
              disabled={!canProceed || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={!canProceed}
            >
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
