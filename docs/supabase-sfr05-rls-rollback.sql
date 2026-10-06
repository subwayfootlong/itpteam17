-- ==============================================================================
-- SFR-05: Database Access Control & Row-Level Security (RLS) Rollback Script
-- Target: Supabase PostgreSQL Database (Public Schema)
--
-- Description:
--   Safely reverts all RLS policies, table RLS states, and helper functions
--   introduced in `docs/supabase-sfr05-rls.sql`.
--
-- Instructions:
--   If you ever need to rollback, copy and execute this entire script in the
--   Supabase SQL Editor. It will immediately restore the database to its exact
--   state prior to the SFR-05 RLS migration.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Drop SFR-05 Policies & Disable RLS on Tables that did not originally have RLS
-- ------------------------------------------------------------------------------

-- Table: public.users
DROP POLICY IF EXISTS "Anon denied access to users" ON public.users;
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Admins have full access on users" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Table: public.events
DROP POLICY IF EXISTS "Anyone can view published active events" ON public.events;
DROP POLICY IF EXISTS "Admins have full access on events" ON public.events;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Table: public.event_registrations
DROP POLICY IF EXISTS "Members can view own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Members can insert own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Members can update own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Members can delete own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins have full access on event_registrations" ON public.event_registrations;
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;

-- Table: public.benefits
DROP POLICY IF EXISTS "Members can view active benefits" ON public.benefits;
DROP POLICY IF EXISTS "Admins have full access on benefits" ON public.benefits;
ALTER TABLE public.benefits DISABLE ROW LEVEL SECURITY;

-- Table: public.announcements
DROP POLICY IF EXISTS "Members can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins have full access on announcements" ON public.announcements;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;

-- Table: public.announcement_comments
DROP POLICY IF EXISTS "Members can view approved announcement comments or own" ON public.announcement_comments;
DROP POLICY IF EXISTS "Members can create own announcement comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "Members can delete own announcement comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "Admins have full access on announcement_comments" ON public.announcement_comments;
ALTER TABLE public.announcement_comments DISABLE ROW LEVEL SECURITY;

-- Table: public.announcement_poll_responses
DROP POLICY IF EXISTS "Members can view announcement poll responses" ON public.announcement_poll_responses;
DROP POLICY IF EXISTS "Members can insert own poll responses" ON public.announcement_poll_responses;
DROP POLICY IF EXISTS "Members can update own poll responses" ON public.announcement_poll_responses;
DROP POLICY IF EXISTS "Admins have full access on announcement_poll_responses" ON public.announcement_poll_responses;
ALTER TABLE public.announcement_poll_responses DISABLE ROW LEVEL SECURITY;

-- Table: public.discussion_groups
DROP POLICY IF EXISTS "Members can view discussion groups" ON public.discussion_groups;
DROP POLICY IF EXISTS "Admins have full access on discussion_groups" ON public.discussion_groups;
ALTER TABLE public.discussion_groups DISABLE ROW LEVEL SECURITY;

-- Table: public.discussion
DROP POLICY IF EXISTS "Members can view approved discussions or own" ON public.discussion;
DROP POLICY IF EXISTS "Members can create own discussions" ON public.discussion;
DROP POLICY IF EXISTS "Members can update own discussions" ON public.discussion;
DROP POLICY IF EXISTS "Admins have full access on discussion" ON public.discussion;
ALTER TABLE public.discussion DISABLE ROW LEVEL SECURITY;

-- Table: public.discussion_comments
DROP POLICY IF EXISTS "Members can view approved discussion comments or own" ON public.discussion_comments;
DROP POLICY IF EXISTS "Members can create own discussion comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Members can update own discussion comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Admins have full access on discussion_comments" ON public.discussion_comments;
ALTER TABLE public.discussion_comments DISABLE ROW LEVEL SECURITY;

-- Table: public.payment_methods
DROP POLICY IF EXISTS "Members can view active payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins have full access on payment_methods" ON public.payment_methods;
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 2. Restore Original Policies for Tables That Already Had RLS Prior to SFR-05
-- ------------------------------------------------------------------------------

-- Table: public.notifications
DROP POLICY IF EXISTS "Admins have full access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Table: public.notification_preferences
DROP POLICY IF EXISTS "Users can read own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can read own notification preferences"
  ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: public.tier_upgrade_requests
DROP POLICY IF EXISTS "Admins have full access on tier_upgrade_requests" ON public.tier_upgrade_requests;
DROP POLICY IF EXISTS "Members can read own tier requests" ON public.tier_upgrade_requests;
DROP POLICY IF EXISTS "Members can create own tier requests" ON public.tier_upgrade_requests;

CREATE POLICY "Members can read own tier requests"
  ON public.tier_upgrade_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can create own tier requests"
  ON public.tier_upgrade_requests FOR INSERT WITH CHECK (auth.uid() = user_id and status = 'pending');

-- Table: public.analytics_events
DROP POLICY IF EXISTS "Allow insertions from authenticated members" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow select for admin role only" ON public.analytics_events;

CREATE POLICY "Allow insertions from authenticated members"
  ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow select for admin role only"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Legacy Tables (uc6_*): Disable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_announcements') THEN
    EXECUTE 'ALTER TABLE public.uc6_announcements DISABLE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_announcement_comments') THEN
    EXECUTE 'ALTER TABLE public.uc6_announcement_comments DISABLE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_discussion_groups') THEN
    EXECUTE 'ALTER TABLE public.uc6_discussion_groups DISABLE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_discussion_threads') THEN
    EXECUTE 'ALTER TABLE public.uc6_discussion_threads DISABLE ROW LEVEL SECURITY;';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_thread_comments') THEN
    EXECUTE 'ALTER TABLE public.uc6_thread_comments DISABLE ROW LEVEL SECURITY;';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Drop Helper Function
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_admin();
