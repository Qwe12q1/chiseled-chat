-- Fix infinite recursion in chat_members RLS by moving membership check into a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.is_chat_member(_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id = _chat_id
      AND cm.user_id = _user_id
  );
$$;

-- Replace recursive policy
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;

CREATE POLICY "Users can view members of their chats"
ON public.chat_members
FOR SELECT
TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()));
