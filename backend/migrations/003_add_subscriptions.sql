-- Migration: Add subscriptions table for payment/tier management
-- Run this in Supabase Dashboard → SQL Editor

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  status text not null default 'free' check (status in ('free', 'trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  uploads_this_week int not null default 0,
  week_reset_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.subscriptions enable row level security;

-- Policies for subscriptions
-- Users can view their own subscription
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Users can insert their own subscription (for initial creation)
create policy "Users can insert their own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Users can update their own subscription
create policy "Users can update their own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Service role can do everything (for webhook handlers)
-- Note: The service role key bypasses RLS by default

-- Indexes for performance
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

-- Add quiz_count column to materials table if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'materials'
    and column_name = 'quiz_count'
  ) then
    alter table public.materials add column quiz_count int not null default 0;
  end if;
end $$;
