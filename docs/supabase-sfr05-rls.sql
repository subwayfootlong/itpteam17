-- ==============================================================================
-- SFR-05: Database Access Control & Row-Level Security (RLS) Master Migration
-- Target: Supabase PostgreSQL Database (Public Schema)
-- 
-- Description:
--   Enforces database-level access restrictions through Row-Level Security (RLS)
--   policies across all tables in the Pergas Integrated Members Engagement System.
--
-- Instructions:
--   Execute this script in the Supabase SQL Editor.
--   It is completely idempotent (uses DROP POLICY IF EXISTS before CREATE POLICY).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 0. Security Definer Helper: Fast Admin Check Function
--    Prevents recursive RLS evaluation on public.users and improves performance.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;


-- ==============================================================================
-- 1. Table: public.users
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon denied access to users" ON public.users;
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Admins have full access on users" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- Authenticated members can read their own account details
CREATE POLICY "Users can read own record"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Authenticated members can update their own personal details (name, phone, etc.)
CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have full access to read, create, update, and manage users
CREATE POLICY "Admins have full access on users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Column-level hardening (belt and braces on top of the row policies above):
--   * anon gets no access to users at all
--   * authenticated can never read password_hash
--   * authenticated can only update harmless profile columns, so a member can never
--     change their own role / membership_tier / status / expiry via the Data API.
-- The Next.js server uses the service-role key, which is unaffected by these grants.
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM authenticated;
GRANT SELECT (id, email, created_at, role, member_id, membership_tier, membership_status,
              expiry_date, phone, arabic_name, member_since, first_name, last_name,
              organization, designation, salutation, ars_status, profile_image_url)
  ON public.users TO authenticated;
GRANT UPDATE (phone, arabic_name, first_name, last_name, organization, designation,
              salutation, ars_status, profile_image_url)
  ON public.users TO authenticated;


-- ==============================================================================
-- 2. Table: public.events
-- ==============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published active events" ON public.events;
DROP POLICY IF EXISTS "Admins have full access on events" ON public.events;

-- Public/anon can only see published events open to everyone (tier-gated events are
-- served by the server after a tier check). events has no is_active column.
CREATE POLICY "Anyone can view published active events"
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND audience_type = 'all');

-- Admins can create, update, and delete events
CREATE POLICY "Admins have full access on events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 3. Table: public.event_registrations
-- ==============================================================================
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Members can insert own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Members can update own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Members can delete own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Admins have full access on event_registrations" ON public.event_registrations;

CREATE POLICY "Members can view own event registrations"
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Members can register themselves (status must be 'registered') and cancel (DELETE),
-- but cannot update a registration, so a rejected one cannot be flipped back.
CREATE POLICY "Members can insert own event registrations"
  ON public.event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND (status IS NULL OR status = 'registered'));

CREATE POLICY "Members can delete own event registrations"
  ON public.event_registrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access on event_registrations"
  ON public.event_registrations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 4. Table: public.benefits
-- ==============================================================================
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view active benefits" ON public.benefits;
DROP POLICY IF EXISTS "Admins have full access on benefits" ON public.benefits;

CREATE POLICY "Members can view active benefits"
  ON public.benefits
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND audience_type = 'all');

CREATE POLICY "Admins have full access on benefits"
  ON public.benefits
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 5. Table: public.announcements
-- ==============================================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins have full access on announcements" ON public.announcements;

CREATE POLICY "Members can view published announcements"
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND audience_type = 'all');

CREATE POLICY "Admins have full access on announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 6. Table: public.announcement_comments
-- ==============================================================================
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view approved announcement comments or own" ON public.announcement_comments;
DROP POLICY IF EXISTS "Members can create own announcement comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "Members can delete own announcement comments" ON public.announcement_comments;
DROP POLICY IF EXISTS "Admins have full access on announcement_comments" ON public.announcement_comments;

CREATE POLICY "Members can view approved announcement comments or own"
  ON public.announcement_comments
  FOR SELECT
  TO authenticated
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Members can create own announcement comments"
  ON public.announcement_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Members can delete own announcement comments"
  ON public.announcement_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access on announcement_comments"
  ON public.announcement_comments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 7. Table: public.announcement_poll_responses
-- ==============================================================================
ALTER TABLE public.announcement_poll_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view announcement poll responses" ON public.announcement_poll_responses;
DROP POLICY IF EXISTS "Members can insert own poll responses" ON public.announcement_poll_responses;
DROP POLICY IF EXISTS "Members can update own poll responses" ON public.announcement_poll_responses;
DROP POLICY IF EXISTS "Admins have full access on announcement_poll_responses" ON public.announcement_poll_responses;

CREATE POLICY "Members can view announcement poll responses"
  ON public.announcement_poll_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members can insert own poll responses"
  ON public.announcement_poll_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update own poll responses"
  ON public.announcement_poll_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access on announcement_poll_responses"
  ON public.announcement_poll_responses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 8. Table: public.discussion_groups
-- ==============================================================================
ALTER TABLE public.discussion_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view discussion groups" ON public.discussion_groups;
DROP POLICY IF EXISTS "Admins have full access on discussion_groups" ON public.discussion_groups;

CREATE POLICY "Members can view discussion groups"
  ON public.discussion_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins have full access on discussion_groups"
  ON public.discussion_groups
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 9. Table: public.discussion
-- ==============================================================================
ALTER TABLE public.discussion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view approved discussions or own" ON public.discussion;
DROP POLICY IF EXISTS "Members can create own discussions" ON public.discussion;
DROP POLICY IF EXISTS "Members can update own discussions" ON public.discussion;
DROP POLICY IF EXISTS "Admins have full access on discussion" ON public.discussion;

CREATE POLICY "Members can view approved discussions or own"
  ON public.discussion
  FOR SELECT
  TO authenticated
  USING (status = 'approved' OR auth.uid() = user_id);

-- New threads always start as pending moderation; members cannot edit them afterwards
-- (an UPDATE policy would let a member self-approve by changing status).
CREATE POLICY "Members can create own discussions"
  ON public.discussion
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins have full access on discussion"
  ON public.discussion
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 10. Table: public.discussion_comments
-- ==============================================================================
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view approved discussion comments or own" ON public.discussion_comments;
DROP POLICY IF EXISTS "Members can create own discussion comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Members can update own discussion comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Admins have full access on discussion_comments" ON public.discussion_comments;

CREATE POLICY "Members can view approved discussion comments or own"
  ON public.discussion_comments
  FOR SELECT
  TO authenticated
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Members can create own discussion comments"
  ON public.discussion_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins have full access on discussion_comments"
  ON public.discussion_comments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 11. Table: public.notifications
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins have full access on notifications" ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access on notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 12. Table: public.notification_preferences
-- ==============================================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can read own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 13. Table: public.tier_upgrade_requests
-- ==============================================================================
ALTER TABLE public.tier_upgrade_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own tier requests" ON public.tier_upgrade_requests;
DROP POLICY IF EXISTS "Members can create own tier requests" ON public.tier_upgrade_requests;
DROP POLICY IF EXISTS "Admins have full access on tier_upgrade_requests" ON public.tier_upgrade_requests;

CREATE POLICY "Members can read own tier requests"
  ON public.tier_upgrade_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create own tier requests"
  ON public.tier_upgrade_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins have full access on tier_upgrade_requests"
  ON public.tier_upgrade_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 14. Table: public.analytics_events
-- ==============================================================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insertions from authenticated members" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow select for admin role only" ON public.analytics_events;

CREATE POLICY "Allow insertions from authenticated members"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow select for admin role only"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());


-- ==============================================================================
-- 15. Table: public.payment_methods
-- ==============================================================================
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view active payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins have full access on payment_methods" ON public.payment_methods;

CREATE POLICY "Members can view active payment methods"
  ON public.payment_methods
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins have full access on payment_methods"
  ON public.payment_methods
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 16. Legacy Tables (uc6_* fallback tables)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_announcements') THEN
    EXECUTE 'ALTER TABLE public.uc6_announcements ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view uc6 announcements" ON public.uc6_announcements;';
    EXECUTE 'CREATE POLICY "Anyone can view uc6 announcements" ON public.uc6_announcements FOR SELECT TO anon, authenticated USING (status = ''published'');';
    EXECUTE 'DROP POLICY IF EXISTS "Admins full access uc6 announcements" ON public.uc6_announcements;';
    EXECUTE 'CREATE POLICY "Admins full access uc6 announcements" ON public.uc6_announcements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_announcement_comments') THEN
    EXECUTE 'ALTER TABLE public.uc6_announcement_comments ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'DROP POLICY IF EXISTS "Members can read uc6 comments" ON public.uc6_announcement_comments;';
    EXECUTE 'CREATE POLICY "Members can read uc6 comments" ON public.uc6_announcement_comments FOR SELECT TO authenticated USING (status = ''approved'' OR auth.uid() = user_id);';
    EXECUTE 'DROP POLICY IF EXISTS "Members can insert uc6 comments" ON public.uc6_announcement_comments;';
    EXECUTE 'CREATE POLICY "Members can insert uc6 comments" ON public.uc6_announcement_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = ''pending'');';
    EXECUTE 'DROP POLICY IF EXISTS "Admins full access uc6 comments" ON public.uc6_announcement_comments;';
    EXECUTE 'CREATE POLICY "Admins full access uc6 comments" ON public.uc6_announcement_comments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_discussion_groups') THEN
    EXECUTE 'ALTER TABLE public.uc6_discussion_groups ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'DROP POLICY IF EXISTS "Members can read uc6 discussion groups" ON public.uc6_discussion_groups;';
    EXECUTE 'CREATE POLICY "Members can read uc6 discussion groups" ON public.uc6_discussion_groups FOR SELECT TO authenticated USING (true);';
    EXECUTE 'DROP POLICY IF EXISTS "Admins full access uc6 discussion groups" ON public.uc6_discussion_groups;';
    EXECUTE 'CREATE POLICY "Admins full access uc6 discussion groups" ON public.uc6_discussion_groups FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_discussion_threads') THEN
    EXECUTE 'ALTER TABLE public.uc6_discussion_threads ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'DROP POLICY IF EXISTS "Members can read uc6 discussion threads" ON public.uc6_discussion_threads;';
    EXECUTE 'CREATE POLICY "Members can read uc6 discussion threads" ON public.uc6_discussion_threads FOR SELECT TO authenticated USING (status = ''approved'' OR auth.uid() = user_id);';
    EXECUTE 'DROP POLICY IF EXISTS "Members can insert uc6 discussion threads" ON public.uc6_discussion_threads;';
    EXECUTE 'CREATE POLICY "Members can insert uc6 discussion threads" ON public.uc6_discussion_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = ''pending'');';
    EXECUTE 'DROP POLICY IF EXISTS "Admins full access uc6 discussion threads" ON public.uc6_discussion_threads;';
    EXECUTE 'CREATE POLICY "Admins full access uc6 discussion threads" ON public.uc6_discussion_threads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uc6_thread_comments') THEN
    EXECUTE 'ALTER TABLE public.uc6_thread_comments ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'DROP POLICY IF EXISTS "Members can read uc6 thread comments" ON public.uc6_thread_comments;';
    EXECUTE 'CREATE POLICY "Members can read uc6 thread comments" ON public.uc6_thread_comments FOR SELECT TO authenticated USING (status = ''approved'' OR auth.uid() = user_id);';
    EXECUTE 'DROP POLICY IF EXISTS "Members can insert uc6 thread comments" ON public.uc6_thread_comments;';
    EXECUTE 'CREATE POLICY "Members can insert uc6 thread comments" ON public.uc6_thread_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = ''pending'');';
    EXECUTE 'DROP POLICY IF EXISTS "Admins full access uc6 thread comments" ON public.uc6_thread_comments;';
    EXECUTE 'CREATE POLICY "Admins full access uc6 thread comments" ON public.uc6_thread_comments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());';
  END IF;
END $$;
