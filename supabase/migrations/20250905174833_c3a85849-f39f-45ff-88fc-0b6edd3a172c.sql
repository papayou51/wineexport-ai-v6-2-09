-- Add deletion token fields to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN deletion_token TEXT,
ADD COLUMN deletion_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deletion_expires_at TIMESTAMP WITH TIME ZONE;