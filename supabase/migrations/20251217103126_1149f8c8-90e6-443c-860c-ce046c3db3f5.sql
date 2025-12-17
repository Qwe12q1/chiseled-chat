-- 1) Subscriptions (needed by useSubscription)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can view own subscription'
  ) THEN
    CREATE POLICY "Users can view own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can create own subscription'
  ) THEN
    CREATE POLICY "Users can create own subscription"
    ON public.subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can update own subscription'
  ) THEN
    CREATE POLICY "Users can update own subscription"
    ON public.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2) Daily message counts (needed by free limit logic)
CREATE TABLE IF NOT EXISTS public.daily_message_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_date)
);

ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'daily_message_counts' AND policyname = 'Users can view own daily message counts'
  ) THEN
    CREATE POLICY "Users can view own daily message counts"
    ON public.daily_message_counts
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'daily_message_counts' AND policyname = 'Users can create own daily message counts'
  ) THEN
    CREATE POLICY "Users can create own daily message counts"
    ON public.daily_message_counts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'daily_message_counts' AND policyname = 'Users can update own daily message counts'
  ) THEN
    CREATE POLICY "Users can update own daily message counts"
    ON public.daily_message_counts
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Fix missing relationships for nested selects (chat_members -> profiles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.chat_members
    ADD CONSTRAINT chat_members_user_id_profiles_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles (id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_members_chat_id_chats_fkey'
  ) THEN
    ALTER TABLE public.chat_members
    ADD CONSTRAINT chat_members_chat_id_chats_fkey
    FOREIGN KEY (chat_id)
    REFERENCES public.chats (id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_daily_message_counts_user_date ON public.daily_message_counts (user_id, message_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
