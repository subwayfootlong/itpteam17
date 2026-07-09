-- Setup UC10: App Engagement Metrics & Analytics table
-- Run this in the Supabase SQL editor after public.users exists.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'event_view', 'event_rsvp_click', 'benefit_view', 'announcement_view', 'login'
  target_id text,          -- ID of the event, benefit, or announcement being interacted with (text to support mock/alphanumeric IDs)
  category text NOT NULL,  -- 'event', 'benefit', 'announcement', 'system'
  metadata jsonb DEFAULT '{}'::jsonb, -- dynamic context (e.g. title, tier, device type)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add performance indexing for analytics aggregation
CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx 
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx 
  ON public.analytics_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_target_idx 
  ON public.analytics_events (target_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow insert by authenticated users, only allow select/read by admin users
CREATE POLICY "Allow insertions from authenticated members"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow select for admin role only"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
