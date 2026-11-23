CREATE TABLE IF NOT EXISTS public.logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  prefix text NOT NULL,
  message text,
  metadata jsonb,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  -- Shared with another app: this app's rows are 'wallet' (the default)
  project text NOT NULL DEFAULT 'wallet'
);

-- Existing databases created before the column existed
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS project text NOT NULL DEFAULT 'wallet';

CREATE INDEX IF NOT EXISTS logs_created_at_idx ON public.logs (created_at DESC);
CREATE INDEX IF NOT EXISTS logs_level_created_at_idx ON public.logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS logs_project_created_at_idx ON public.logs (project, created_at DESC);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
