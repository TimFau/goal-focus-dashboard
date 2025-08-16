-- Add task_focus_log table
CREATE TABLE IF NOT EXISTS public.task_focus_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id),
  date date NOT NULL,
  minutes int NOT NULL,
  source text, -- e.g., 'timer', 'manual'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_focus_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_focus_log are self-owned" ON public.task_focus_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add focus mode settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN babauta_mode_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN top3_focus_target_minutes int DEFAULT 90 NOT NULL;
