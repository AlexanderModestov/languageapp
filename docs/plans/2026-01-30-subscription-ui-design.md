# Subscription UI Design

## Overview

Add frontend UI for the Stripe subscription system with a dedicated subscription page, success page after checkout, and contextual upgrade banners when users hit limits.

## Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/subscription` | `SubscriptionPage.tsx` | Main subscription page (different views for free/pro) |
| `/subscription/success` | `SubscriptionSuccess.tsx` | Post-checkout celebration page |

## Components

### New Files

```
/src
  /pages
    SubscriptionPage.tsx      # Main subscription page
    SubscriptionSuccess.tsx   # Post-checkout success page
  /components
    UpgradeBanner.tsx         # Contextual upgrade prompt banner
  /hooks
    useSubscription.ts        # React Query hook for subscription data
```

### API Additions (`api.ts`)

```typescript
interface SubscriptionResponse {
  status: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled'
  tier: 'free' | 'pro'
  trial_end: string | null
  current_period_end: string | null
  uploads_this_week: number
  upload_limit: number
  week_reset_at: string
}

interface CheckoutResponse {
  checkout_url: string
  session_id: string
}

// Endpoints
getSubscription(): Promise<SubscriptionResponse>
createCheckoutSession(): Promise<CheckoutResponse>
cancelSubscription(): Promise<void>
```

## Page Designs

### Subscription Page - Free Users

```
┌─────────────────────────────────────────────────┐
│  Hero Section (Card with gradient/accent)       │
│  ┌───────────────────────────────────────────┐  │
│  │ ⚡ Unlock Your Full Learning Potential    │  │
│  │                                           │  │
│  │ Get unlimited uploads, AI chat, and more │  │
│  │ with a 7-day free trial.                 │  │
│  │                                           │  │
│  │ [Start Pro Trial - €20/month]            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Comparison Table                               │
│  ┌──────────────────┬──────────────────┐       │
│  │ Free             │ Pro              │       │
│  ├──────────────────┼──────────────────┤       │
│  │ 1 upload/week    │ 10 uploads/week  │       │
│  │ 3 quizzes/mat.   │ 10 quizzes/mat.  │       │
│  │ ✗ AI Chat        │ ✓ AI Chat        │       │
│  │                  │ 7-day free trial │       │
│  └──────────────────┴──────────────────┘       │
│                                                 │
│  Current Usage                                  │
│  Uploads: 1/1 this week • Resets in 5 days     │
└─────────────────────────────────────────────────┘
```

### Subscription Page - Pro Users

```
┌─────────────────────────────────────────────────┐
│  Status Card                                    │
│  ┌───────────────────────────────────────────┐  │
│  │ Pro Plan                    [Active] badge│  │
│  │                                           │  │
│  │ Your next billing date is Feb 28, 2026   │  │
│  │ €20/month                                 │  │
│  │                                           │  │
│  │               [Cancel Subscription]       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Status badge variants:**
- `Active` - green badge
- `Trialing` - blue badge, show "Trial ends {date}"
- `Past Due` - yellow/warning badge
- `Canceled` - gray badge, show "Access until {date}"

**Cancel flow:**
1. Click "Cancel Subscription"
2. Confirmation dialog: "Are you sure? You'll lose Pro features immediately."
3. On confirm: call API, page updates to free state

### Success Page

```
┌─────────────────────────────────────────────────┐
│                    🎉                           │
│                                                 │
│           Welcome to Pro!                       │
│                                                 │
│   Your 7-day trial has started.                │
│   Enjoy unlimited uploads, AI chat, and more.  │
│                                                 │
│           [Go to Dashboard]                     │
│                                                 │
│      Redirecting in 5 seconds...               │
└─────────────────────────────────────────────────┘
```

- Auto-redirect to dashboard after 5 seconds
- Countdown shown, or user clicks button immediately

### Upgrade Banner

```
┌─────────────────────────────────────────────────┐
│ ⚡ You've reached your free upload limit.       │
│    Upgrade to Pro for 10 uploads/week.          │
│                           [Upgrade] [✕]         │
└─────────────────────────────────────────────────┘
```

**Variants:**
- Upload limit: "You've reached your free upload limit. Upgrade to Pro for 10 uploads/week."
- Quiz limit: "You've reached the quiz limit for this material. Upgrade to Pro for more."
- Chat access: "AI Chat is a Pro feature. Upgrade to unlock unlimited conversations."

**Behavior:**
- Appears at top of page (below header)
- Dismissible with X button
- Reappears on next limit hit
- Amber/warning background color

## Navigation

Add "Subscription" link to header navigation in `Layout.tsx`.

## Implementation Tasks

1. Add subscription API functions to `api.ts`
2. Create `useSubscription.ts` hook with React Query
3. Create `SubscriptionPage.tsx` with free/pro views
4. Create `SubscriptionSuccess.tsx` celebration page
5. Create `UpgradeBanner.tsx` component
6. Add routes to `App.tsx`
7. Add navigation link to `Layout.tsx`
8. Integrate banner into pages that enforce limits (Dashboard for uploads, MaterialView for quizzes/chat)
