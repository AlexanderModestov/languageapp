import { X, Zap } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type UpgradeBannerVariant = "upload" | "quiz" | "chat"

interface UpgradeBannerProps {
  variant: UpgradeBannerVariant
  className?: string
}

const messages: Record<UpgradeBannerVariant, { title: string; description: string }> = {
  upload: {
    title: "You've reached your free upload limit.",
    description: "Upgrade to Pro for 10 uploads/week.",
  },
  quiz: {
    title: "You've reached the quiz limit for this material.",
    description: "Upgrade to Pro for more quizzes.",
  },
  chat: {
    title: "AI Chat is a Pro feature.",
    description: "Upgrade to unlock unlimited conversations.",
  },
}

export function UpgradeBanner({ variant, className }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const { title, description } = messages[variant]

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Zap className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-amber-900">{title}</span>{" "}
          <span className="text-amber-700">{description}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/subscription">
          <Button size="sm" variant="default">
            Upgrade
          </Button>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
