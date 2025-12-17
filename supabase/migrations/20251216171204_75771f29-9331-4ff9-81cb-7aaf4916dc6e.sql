-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_members;

-- Create new policy that allows chat creators to add members
CREATE POLICY "Users can add members to chats they created"
ON public.chat_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = chat_id 
    AND chats.created_by = auth.uid()
  )
);