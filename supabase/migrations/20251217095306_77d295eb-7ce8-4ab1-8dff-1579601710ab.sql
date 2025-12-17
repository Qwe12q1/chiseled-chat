-- Make chat creation robust: force created_by to auth.uid() on insert and relax INSERT policy accordingly

-- 1) Trigger function to enforce created_by
CREATE OR REPLACE FUNCTION public.set_chat_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication context
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Always set to the authenticated user (prevents spoofing)
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- 2) Trigger
DROP TRIGGER IF EXISTS chats_set_created_by ON public.chats;
CREATE TRIGGER chats_set_created_by
BEFORE INSERT ON public.chats
FOR EACH ROW
EXECUTE FUNCTION public.set_chat_created_by();

-- 3) Update INSERT policy: only require authenticated; trigger enforces created_by
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
