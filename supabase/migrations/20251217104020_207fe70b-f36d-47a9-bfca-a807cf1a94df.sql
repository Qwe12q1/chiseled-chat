-- Fix ambiguous embedded relationships caused by duplicate foreign keys
-- This prevents errors like: "Could not embed because more than one relationship was found..."

ALTER TABLE public.chat_members
  DROP CONSTRAINT IF EXISTS chat_members_chat_id_chats_fkey;

ALTER TABLE public.chat_members
  DROP CONSTRAINT IF EXISTS chat_members_user_id_fkey;
