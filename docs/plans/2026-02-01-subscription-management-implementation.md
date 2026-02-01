# Subscription Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow subscribers to view their subscription status, cancel at period end, and reactivate before expiration.

**Architecture:** Modify the existing cancel endpoint to use Stripe's `cancel_at_period_end` instead of immediate cancellation. Add a reactivate endpoint. Update frontend to show appropriate messaging and actions based on cancellation state.

**Tech Stack:** FastAPI, Stripe API, React, React Query, TailwindCSS

---

## Task 1: Add `cancel_at_period_end` to Backend Response Model

**Files:**
- Modify: `backend/app/models/subscription.py:16-26`
- Modify: `backend/app/services/subscription.py:164-180`

**Step 1: Update SubscriptionResponse model**

In `backend/app/models/subscription.py`, add the `cancel_at_period_end` field:

```python
class SubscriptionResponse(BaseModel):
    """Response model for subscription status endpoint."""

    status: SubscriptionStatus
    tier: Literal["free", "pro"]
    trial_end: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    uploads_used: int
    uploads_limit: int
    quizzes_per_material_limit: int
    can_use_chat: bool
```

**Step 2: Update get_subscription_response to include cancel_at_period_end**

In `backend/app/services/subscription.py`, update the `get_subscription_response` function:

```python
def get_subscription_response(user_id: UUID, supabase: Client, settings: Settings) -> dict:
    """Get full subscription status for API response."""
    subscription = get_or_create_subscription(user_id, supabase)
    subscription = maybe_reset_weekly_usage(subscription, supabase)

    tier = get_user_tier(subscription)

    return {
        "status": subscription.get("status", "free"),
        "tier": tier,
        "trial_end": subscription.get("trial_end"),
        "current_period_end": subscription.get("current_period_end"),
        "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
        "uploads_used": subscription.get("uploads_this_week", 0),
        "uploads_limit": settings.pro_uploads_per_week if tier == "pro" else settings.free_uploads_per_week,
        "quizzes_per_material_limit": settings.pro_quizzes_per_material if tier == "pro" else settings.free_quizzes_per_material,
        "can_use_chat": tier == "pro",
    }
```

**Step 3: Verify changes compile**

Run: `cd backend && python -c "from app.models.subscription import SubscriptionResponse; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/app/models/subscription.py backend/app/services/subscription.py
git commit -m "feat: add cancel_at_period_end to subscription response"
```

---

## Task 2: Modify Cancel Endpoint to Use cancel_at_period_end

**Files:**
- Modify: `backend/app/routers/payments.py:332-362`

**Step 1: Update cancel endpoint to cancel at period end**

Replace the `cancel_user_subscription` function in `backend/app/routers/payments.py`:

```python
@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_user_subscription(
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> SubscriptionResponse:
    """Cancel the user's subscription at period end."""
    stripe.api_key = settings.stripe_secret_key

    subscription = get_or_create_subscription(current_user.id, supabase)

    if subscription.get("status") == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel",
        )

    # Cancel at period end in Stripe
    stripe_sub_id = subscription.get("stripe_subscription_id")
    if stripe_sub_id:
        try:
            stripe.Subscription.modify(
                stripe_sub_id,
                cancel_at_period_end=True,
            )
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel Stripe subscription: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel subscription",
            )

    # Update local status to reflect pending cancellation
    supabase.table("subscriptions").update({
        "cancel_at_period_end": True,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", subscription["id"]).execute()

    # Return updated status
    data = get_subscription_response(current_user.id, supabase, settings)
    return SubscriptionResponse(**data)
```

**Step 2: Remove the immediate cancel_subscription call**

The old code called `cancel_subscription(current_user.id, supabase)` which set status to "free" immediately. This is now removed - the subscription stays active until the period ends (handled by Stripe webhook).

**Step 3: Verify syntax**

Run: `cd backend && python -c "from app.routers.payments import router; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/app/routers/payments.py
git commit -m "feat: change cancel to use cancel_at_period_end"
```

---

## Task 3: Add Reactivate Endpoint

**Files:**
- Modify: `backend/app/routers/payments.py` (add new endpoint after cancel)

**Step 1: Add reactivate endpoint**

Add this new endpoint after the cancel endpoint in `backend/app/routers/payments.py`:

```python
@router.post("/reactivate", response_model=SubscriptionResponse)
async def reactivate_subscription(
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
) -> SubscriptionResponse:
    """Reactivate a subscription that was scheduled for cancellation."""
    stripe.api_key = settings.stripe_secret_key

    subscription = get_or_create_subscription(current_user.id, supabase)

    if subscription.get("status") == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No subscription to reactivate",
        )

    if not subscription.get("cancel_at_period_end"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not scheduled for cancellation",
        )

    # Reactivate in Stripe
    stripe_sub_id = subscription.get("stripe_subscription_id")
    if stripe_sub_id:
        try:
            stripe.Subscription.modify(
                stripe_sub_id,
                cancel_at_period_end=False,
            )
        except stripe.error.StripeError as e:
            logger.error(f"Failed to reactivate Stripe subscription: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reactivate subscription",
            )

    # Update local status
    supabase.table("subscriptions").update({
        "cancel_at_period_end": False,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", subscription["id"]).execute()

    # Return updated status
    data = get_subscription_response(current_user.id, supabase, settings)
    return SubscriptionResponse(**data)
```

**Step 2: Verify syntax**

Run: `cd backend && python -c "from app.routers.payments import router; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/app/routers/payments.py
git commit -m "feat: add reactivate subscription endpoint"
```

---

## Task 4: Update Webhook to Sync cancel_at_period_end

**Files:**
- Modify: `backend/app/routers/payments.py:179-228` (handle_subscription_updated function)

**Step 1: Update handle_subscription_updated to sync cancel_at_period_end**

Update the `handle_subscription_updated` function to include `cancel_at_period_end`:

```python
async def handle_subscription_updated(subscription: dict, supabase: Client):
    """Handle subscription updates (status changes, renewals)."""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    stripe_status = subscription.get("status")
    cancel_at_period_end = subscription.get("cancel_at_period_end", False)

    # Map Stripe status to our status
    status_map = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
    }
    status = status_map.get(stripe_status, "free")

    # Find user by stripe_customer_id
    result = (
        supabase.table("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customer_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        logger.error(f"No subscription found for customer {customer_id}")
        return

    user_id = result.data["user_id"]

    trial_end = None
    if subscription.get("trial_end"):
        trial_end = datetime.fromtimestamp(subscription["trial_end"], tz=timezone.utc)

    period_start = datetime.fromtimestamp(subscription["current_period_start"], tz=timezone.utc)
    period_end = datetime.fromtimestamp(subscription["current_period_end"], tz=timezone.utc)

    # Update subscription with cancel_at_period_end
    supabase.table("subscriptions").update({
        "stripe_subscription_id": subscription_id,
        "status": status,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "current_period_start": period_start.isoformat(),
        "current_period_end": period_end.isoformat(),
        "cancel_at_period_end": cancel_at_period_end,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    logger.info(f"Subscription updated for user {user_id}: {status}, cancel_at_period_end={cancel_at_period_end}")
```

**Step 2: Verify syntax**

Run: `cd backend && python -c "from app.routers.payments import router; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/app/routers/payments.py
git commit -m "feat: sync cancel_at_period_end from Stripe webhooks"
```

---

## Task 5: Update Frontend API Types and Functions

**Files:**
- Modify: `frontend/src/lib/api.ts:248-273`

**Step 1: Update Subscription type to include cancel_at_period_end**

Update the `Subscription` type in `frontend/src/lib/api.ts`:

```typescript
export type Subscription = {
  status: SubscriptionStatus
  tier: "free" | "pro"
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  uploads_this_week: number
  upload_limit: number
  quizzes_per_material_limit: number
  week_reset_at: string
}
```

**Step 2: Add reactivate API function**

Update the `subscriptionApi` object:

```typescript
export const subscriptionApi = {
  get: (): Promise<Subscription> =>
    fetchWithAuth("/payments/subscription"),

  createCheckoutSession: (): Promise<CheckoutSession> =>
    fetchWithAuth("/payments/create-checkout-session", { method: "POST" }),

  cancel: (): Promise<Subscription> =>
    fetchWithAuth("/payments/cancel", { method: "POST" }),

  reactivate: (): Promise<Subscription> =>
    fetchWithAuth("/payments/reactivate", { method: "POST" }),
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors (or only pre-existing errors)

**Step 4: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat: add cancel_at_period_end and reactivate to frontend API"
```

---

## Task 6: Add useReactivateSubscription Hook

**Files:**
- Modify: `frontend/src/hooks/useSubscription.ts`

**Step 1: Add reactivate hook**

Add this new hook to `frontend/src/hooks/useSubscription.ts`:

```typescript
export function useReactivateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subscriptionApi.reactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] })
    },
  })
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/hooks/useSubscription.ts
git commit -m "feat: add useReactivateSubscription hook"
```

---

## Task 7: Update ProUserView Component

**Files:**
- Modify: `frontend/src/pages/SubscriptionPage.tsx:171-259`

**Step 1: Update ProUserView with new cancel/reactivate logic**

Replace the `ProUserView` function with:

```typescript
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
```

**Step 2: Add import for useReactivateSubscription**

Update the imports at the top of the file:

```typescript
import { useCancelSubscription, useCreateCheckoutSession, useReactivateSubscription, useSubscription } from "@/hooks/useSubscription"
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/pages/SubscriptionPage.tsx
git commit -m "feat: update ProUserView with cancel-at-period-end and reactivate"
```

---

## Task 8: Manual Testing

**Step 1: Start backend**

Run: `cd backend && uvicorn app.main:app --reload`

**Step 2: Start frontend**

Run: `cd frontend && npm run dev`

**Step 3: Test scenarios**

1. **Free user**: Navigate to /subscription, verify paywall is shown
2. **Pro user**: Verify subscription details shown with cancel button
3. **Cancel flow**: Click cancel, verify confirmation shows correct end date, confirm cancellation
4. **Cancelled state**: Verify "Cancelled" badge shows, reactivate button visible
5. **Reactivate flow**: Click reactivate, verify subscription returns to active state

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address manual testing feedback"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add `cancel_at_period_end` to backend response model |
| 2 | Modify cancel endpoint to use `cancel_at_period_end` |
| 3 | Add reactivate endpoint |
| 4 | Update webhook to sync `cancel_at_period_end` |
| 5 | Update frontend API types and functions |
| 6 | Add `useReactivateSubscription` hook |
| 7 | Update `ProUserView` component |
| 8 | Manual testing |
