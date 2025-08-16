-- Add focus rule settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN celebration_cues_enabled boolean DEFAULT true NOT NULL,
ADD COLUMN auto_hide_carry_over_on_focus_done boolean DEFAULT false NOT NULL;
