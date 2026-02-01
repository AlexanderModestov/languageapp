# Subscription Management Design

## Overview

Expand the existing Subscription page to allow subscribers to view their subscription status and cancel/reactivate their subscription. Users who already have a subscription should not see the paywall - they should see their current subscription details and management options.

## User Experience

### Three Page States

**State A: Free User (no subscription)**
- Shows existing upgrade/paywall content
- No changes to current implementation

**State B: Active Subscriber**
- Header: "Your Subscription"
- Displays: Plan name ("Pro Plan"), price ("$X/month"), next billing date
- Cancel button triggers confirmation dialog
- After confirming: subscription cancels at period end, UI switches to State C

**State C: Cancelled (pending expiration)**
- Header: "Your Subscription"
- Displays: Plan name, "Cancelled" badge, access end date
- "Reactivate" button to undo cancellation
- After reactivating: returns to State B with original renewal date

### Cancellation Behavior

- Cancel at period end (not immediate)
- User keeps Pro access until paid period expires
- Can reactivate before expiration to restore subscription

## Backend

### New Endpoints

**GET /api/subscriptions/status**

Returns current user's subscription details:

```json
{
  "status": "none" | "active" | "cancelled",
  "plan_name": "Pro" | null,
  "price": 9.99 | null,
  "current_period_end": "2026-03-01T00:00:00Z" | null,
  "cancel_at_period_end": false
}
```

**POST /api/subscriptions/cancel**

Marks subscription to cancel at period end.
- Calls Stripe `subscription.update` with `cancel_at_period_end: true`
- Returns updated subscription status

**POST /api/subscriptions/reactivate**

Undoes pending cancellation.
- Calls Stripe `subscription.update` with `cancel_at_period_end: false`
- Returns updated subscription status

### Data Source

All subscription data comes from Stripe. Backend fetches user's Stripe subscription using their `stripe_customer_id` stored in the database.

## Frontend

### Component Structure

```
SubscriptionPage
├── Loading state
├── FreeUserView (existing paywall)
└── SubscriberView (new)
    ├── Subscription details card
    │   - Plan name, price, status badge
    │   - Next billing date OR access end date
    ├── Action button (Cancel or Reactivate)
    └── CancelConfirmationModal
```

### Cancel Confirmation Modal

- Message: "Are you sure you want to cancel?"
- Explains access continues until [date]
- Buttons: "Keep Subscription" and "Yes, Cancel"

### State Management

- React Query for fetching subscription status
- Refetch after cancel/reactivate actions
- Loading and error states

### Styling

- Match existing TailwindCSS patterns
- Card layout for subscription details
- Status badges: green for "Active", yellow/orange for "Cancelled"

## Error Handling

**API errors:**
- Show toast notification on cancel/reactivate failure
- Don't change state optimistically

**Edge cases:**

1. **Subscription expires while viewing** - Status endpoint returns fresh data; page shows Free User view after refresh

2. **Webhook race condition** - Cancel/reactivate endpoints return status directly from Stripe response, not database

3. **No Stripe customer** - User on free tier with no `stripe_customer_id` gets `status: "none"`

## Out of Scope

- Payment method updates
- Invoice/payment history
- Plan switching
- Proration handling
