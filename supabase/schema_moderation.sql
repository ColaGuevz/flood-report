-- ==========================================================
-- FLOODWATCH: Phase 1 Moderation & Role-Based Authorization
-- ==========================================================

-- 1. ADD ROLE SYSTEM TO PROFILES
-- Available roles: 'user', 'moderator', 'admin'
-- Default role for all new & existing accounts is 'user'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' 
CHECK (role IN ('user', 'moderator', 'admin'));

-- Create index for quick role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


-- 2. ADD MODERATION STATUS TO POSTS
-- Available statuses: 'visible', 'hidden', 'removed'
-- Default for all existing and new posts is 'visible'
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible' 
CHECK (moderation_status IN ('visible', 'hidden', 'removed'));

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS moderation_reason TEXT DEFAULT NULL;

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT NULL;

-- Create index for filtering feed by moderation status
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON public.posts(moderation_status);


-- 3. CREATE MODERATION AUDIT LOG TABLE
-- Records every moderation action (hide, remove, restore) with reason and moderator ID
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('hide', 'remove', 'restore', 'edit')),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for moderation log queries
CREATE INDEX IF NOT EXISTS idx_moderation_logs_report_id ON public.moderation_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON public.moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);


-- 4. HELPER FUNCTIONS (SECURITY DEFINER to avoid recursion)

-- Function to get the role of the calling user
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN user_role IN ('moderator', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only moderators and admins can view moderation logs
DROP POLICY IF EXISTS "Moderation logs viewable by moderators and admins" ON public.moderation_logs;
CREATE POLICY "Moderation logs viewable by moderators and admins"
    ON public.moderation_logs FOR SELECT
    USING (public.is_moderator_or_admin());

-- Policy: Only moderators and admins can insert moderation logs
DROP POLICY IF EXISTS "Moderation logs insertable by moderators and admins" ON public.moderation_logs;
CREATE POLICY "Moderation logs insertable by moderators and admins"
    ON public.moderation_logs FOR INSERT
    WITH CHECK (public.is_moderator_or_admin());

-- Update / Ensure RLS on posts table for Moderation Status SELECT
DROP POLICY IF EXISTS "Public and users can view visible posts or own posts" ON public.posts;
CREATE POLICY "Public and users can view visible posts or own posts"
    ON public.posts FOR SELECT
    USING (
        moderation_status = 'visible' 
        OR auth.uid() = user_id 
        OR public.is_moderator_or_admin()
    );

-- Policy: Allow moderators and administrators to UPDATE posts (e.g., moderation_status, moderation_reason)
DROP POLICY IF EXISTS "Moderators and admins can update posts" ON public.posts;
CREATE POLICY "Moderators and admins can update posts"
    ON public.posts FOR UPDATE
    USING (public.is_moderator_or_admin())
    WITH CHECK (public.is_moderator_or_admin());

-- Policy: Allow administrators to UPDATE any profile (for assigning moderator and admin roles)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Protect role escalation: non-admin users cannot alter role in profiles table
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is changing, check if the current session is an admin
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER tr_prevent_self_role_escalation
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_escalation();


-- ==========================================================
-- HOW TO CREATE THE FIRST ADMIN ACCOUNT (MANUAL SETUP):
-- ==========================================================
-- In the Supabase SQL Editor, run:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE username = 'your_username_here';
--
-- Alternatively by user ID:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'your-user-uuid-here';
-- ==========================================================
