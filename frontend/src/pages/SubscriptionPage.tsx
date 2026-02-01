import { Check, Loader2, X, Zap } from "lucide-react"
import { useState } from "react"

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCancelSubscription, useCreateCheckoutSession, useReactivateSubscription, useSubscription } from "@/hooks/useSubscription"
import type { SubscriptionStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const config: Record<SubscriptionStatus, { label: string; className: string }> = {
    free: { label: "Free", className: "bg-gray-100 text-gray-800" },
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-800" },
    active: { label: "Active", className: "bg-green-100 text-green-800" },
    past_due: { label: "Past Due", className: "bg-yellow-100 text-yellow-800" },
    canceled: { label: "Canceled", className: "bg-gray-100 text-gray-800" },
  }

  const { label, className } = config[status]

  return (
    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", className)}>
      {label}
    </span>
  )
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatDaysUntil(dateString: string): string {
  const now = new Date()
  const target = new Date(dateString)
  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "today"
  if (diffDays === 1) return "in 1 day"
  return `in ${diffDays} days`
}

function FreeUserView() {
  const { data: subscription } = useSubscription()
  const createCheckout = useCreateCheckoutSession()

  const handleStartTrial = () => {
    createCheckout.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Unlock Your Full Learning Potential</CardTitle>
          <CardDescription className="text-base mt-2">
            Get unlimited uploads, AI chat, and more with a 7-day free trial.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-4">
          <Button
            size="lg"
            onClick={handleStartTrial}
            disabled={createCheckout.isPending}
          >
            {createCheckout.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Start Pro Trial - €20/month"
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Cancel anytime. No charge during trial.
          </p>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <CardDescription>Basic features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">1 upload per week</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm">3 quizzes per material</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">AI Chat</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pro</CardTitle>
                <CardDescription>€20/month</CardDescription>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground">
                Recommended
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">10 uploads per week</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">10 quizzes per material</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Unlimited AI Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">7-day free trial</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Usage */}
      {subscription && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Uploads: {subscription.uploads_this_week}/{subscription.upload_limit} this week
              {subscription.week_reset_at && (
                <span className="text-muted-foreground">
                  {" "}• Resets {formatDaysUntil(subscription.week_reset_at)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ProUserView() {
  const { data: subscription } = useSubscription()
  const cancelSubscription = useCancelSubscription()
  const reactivateSubscription = useReactivateSubscription()
  const [showConfirm, setShowConfirm] = useState(false)

  if (!subscription) return null

  const isCancelled = subscription.cancel_at_period_end

  const handleCancel = () => {
    cancelSubscription.mutate(undefined, {
      onSuccess: () => setShowConfirm(false),
    })
  }

  const handleReactivate = () => {
    reactivateSubscription.mutate()
  }

  const getStatusMessage = () => {
    if (isCancelled) {
      return `Your subscription is cancelled. You have Pro access until ${formatDate(subscription.current_period_end)}.`
    }
    switch (subscription.status) {
      case "trialing":
        return `Your trial ends ${formatDate(subscription.trial_end)}. You'll be charged €20/month after.`
      case "active":
        return `Pro Plan - €20/month. Next billing date: ${formatDate(subscription.current_period_end)}`
      case "past_due":
        return "Payment failed. Please update your payment method."
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Pro Plan</CardTitle>
              <CardDescription className="mt-1">€20/month</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isCancelled && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  Cancelled
                </span>
              )}
              <StatusBadge status={subscription.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>

          {isCancelled ? (
            <Button
              variant="default"
              onClick={handleReactivate}
              disabled={reactivateSubscription.isPending}
            >
              {reactivateSubscription.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reactivating...
                </>
              ) : (
                "Reactivate Subscription"
              )}
            </Button>
          ) : !showConfirm ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowConfirm(true)}
            >
              Cancel Subscription
            </Button>
          ) : (
            <div className="p-4 bg-destructive/10 rounded-lg space-y-3">
              <p className="text-sm font-medium">Are you sure you want to cancel?</p>
              <p className="text-sm text-muted-foreground">
                You'll keep Pro access until {formatDate(subscription.current_period_end)}, then be downgraded to Free.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    "Yes, Cancel"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirm(false)}
                  disabled={cancelSubscription.isPending}
                >
                  Keep Subscription
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function SubscriptionPage() {
  const { data: subscription, isLoading, isError } = useSubscription()

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  // Default to free user view if there's an error or no subscription data
  const isPro = subscription?.tier === "pro"

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Subscription</h1>
        {isError && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800">
                Unable to load subscription data. Showing default options.
              </p>
            </CardContent>
          </Card>
        )}
        {isPro ? <ProUserView /> : <FreeUserView />}
      </div>
    </Layout>
  )
}
