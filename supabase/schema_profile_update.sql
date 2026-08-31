-- ==========================================================
-- FLOODWATCH: Profile 60-Day Edit Cooldown Migration
-- ==========================================================

-- 1. Add profile_last_updated_at column to profiles table
-- Defaults to NULL so existing users and new registrations are NOT locked out.
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create PostgreSQL Trigger Function to enforce the 60-day rule at the database level
-- This ensures that even direct Supabase client updates cannot bypass the 60-day interval.
CREATE OR REPLACE FUNCTION check_profile_update_cooldown()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce interval if username or display_name is being modified
  IF (OLD.username IS DISTINCT FROM NEW.username OR OLD.display_name IS DISTINCT FROM NEW.display_name) THEN
    -- Check if user updated within the last 60 days
    IF OLD.profile_last_updated_at IS NOT NULL AND OLD.profile_last_updated_at > (NOW() - INTERVAL '60 days') THEN
      RAISE EXCEPTION 'Profile editing is locked. You can only update your username and display name once every 60 days. Next edit allowed after %', (OLD.profile_last_updated_at + INTERVAL '60 days');
    END IF;

    -- Automatically stamp the update time
    IF NEW.profile_last_updated_at IS NULL OR NEW.profile_last_updated_at = OLD.profile_last_updated_at THEN
      NEW.profile_last_updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to profiles table
DROP TRIGGER IF EXISTS tr_profile_update_cooldown ON profiles;
CREATE TRIGGER tr_profile_update_cooldown
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_profile_update_cooldown();
