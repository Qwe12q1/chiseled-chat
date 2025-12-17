-- Create an atomic private chat creator that bypasses RLS safely via SECURITY DEFINER
-- This avoids client-side multi-step inserts failing due to RLS timing/session issues.

CREATE OR REPLACE FUNCTION public.create_private_chat(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_chat_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF other_user_id IS NULL THEN
    RAISE EXCEPTION 'other_user_id is required';
  END IF;

  -- Create chat
  INSERT INTO public.chats (type)
  VALUES ('private')
  RETURNING id INTO new_chat_id;

  -- Add creator first
  INSERT INTO public.chat_members (chat_id, user_id, role)
  VALUES (new_chat_id, auth.uid(), 'admin');

  -- Add other user
  INSERT INTO public.chat_members (chat_id, user_id, role)
  VALUES (new_chat_id, other_user_id, 'member');

  RETURN new_chat_id;
END;
$$;