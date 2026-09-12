-- ==========================================================
-- FLOODWATCH: Anti-Spam & Rate Limiting Migration
-- ==========================================================
-- Run this in the Supabase SQL Editor after schema_moderation.sql

-- 1. ADD IDEMPOTENCY KEY TO POSTS TABLE
-- Used to prevent double-click / network retry duplicate submissions
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT DEFAULT NULL;

-- Partial unique index: prevents duplicate idempotency keys per user
-- Only applies when key is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_user_idempotency_key 
ON public.posts(user_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Index for efficient rate limit queries (user's recent posts)
CREATE INDEX IF NOT EXISTS idx_posts_user_created_at 
ON public.posts(user_id, created_at DESC);

-- Index for efficient confirmation rate limit queries
CREATE INDEX IF NOT EXISTS idx_report_confirmations_user_created_at 
ON public.report_confirmations(user_id, created_at DESC);


-- 2. RATE LIMIT CHECK FUNCTION
-- Returns JSON: { allowed, reason, retry_after_seconds }
-- Checks 3 windows: 5min (max 1), 1hr (max 5), 24hr (max 15)
-- Moderators and admins are exempt
CREATE OR REPLACE FUNCTION public.check_report_rate_limit(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_role TEXT;
    last_report_at TIMESTAMPTZ;
    reports_last_hour INT;
    reports_last_day INT;
    seconds_since_last INT;
    retry_after INT;
BEGIN
    -- Check if user is moderator or admin (exempt from rate limits)
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_uuid;
    
    IF user_role IN ('moderator', 'admin') THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'reason', 'Moderator/Admin bypass',
            'retry_after_seconds', 0
        );
    END IF;

    -- Check 1: Last report within 5 minutes
    SELECT created_at INTO last_report_at
    FROM public.posts
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_report_at IS NOT NULL THEN
        seconds_since_last := EXTRACT(EPOCH FROM (NOW() - last_report_at))::INT;
        IF seconds_since_last < 300 THEN
            retry_after := 300 - seconds_since_last;
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', format('Please wait %s before submitting another report.', 
                    CASE 
                        WHEN retry_after >= 60 THEN format('%s minute(s) and %s second(s)', retry_after / 60, retry_after % 60)
                        ELSE format('%s second(s)', retry_after)
                    END),
                'retry_after_seconds', retry_after
            );
        END IF;
    END IF;

    -- Check 2: Max 5 reports per hour
    SELECT COUNT(*) INTO reports_last_hour
    FROM public.posts
    WHERE user_id = user_uuid
      AND created_at > NOW() - INTERVAL '1 hour';

    IF reports_last_hour >= 5 THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'You have reached the maximum of 5 reports per hour. Please try again later.',
            'retry_after_seconds', 3600
        );
    END IF;

    -- Check 3: Max 15 reports per 24 hours
    SELECT COUNT(*) INTO reports_last_day
    FROM public.posts
    WHERE user_id = user_uuid
      AND created_at > NOW() - INTERVAL '24 hours';

    IF reports_last_day >= 15 THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'You have reached the maximum of 15 reports per 24 hours. Please try again tomorrow.',
            'retry_after_seconds', 86400
        );
    END IF;

    -- All checks passed
    RETURN jsonb_build_object(
        'allowed', true,
        'reason', 'OK',
        'retry_after_seconds', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. DUPLICATE REPORT DETECTION FUNCTION
-- Checks if same user submitted a report with similar location in last 30 minutes
-- Returns JSON: { is_duplicate, existing_report_id }
CREATE OR REPLACE FUNCTION public.check_duplicate_report(user_uuid UUID, location_text TEXT)
RETURNS JSONB AS $$
DECLARE
    existing_id BIGINT;
    clean_location TEXT;
BEGIN
    clean_location := LOWER(TRIM(location_text));
    
    SELECT id INTO existing_id
    FROM public.posts
    WHERE user_id = user_uuid
      AND created_at > NOW() - INTERVAL '30 minutes'
      AND LOWER(TRIM(location)) = clean_location
    ORDER BY created_at DESC
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'is_duplicate', true,
            'existing_report_id', existing_id
        );
    END IF;

    RETURN jsonb_build_object(
        'is_duplicate', false,
        'existing_report_id', NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. CONFIRMATION RATE LIMIT FUNCTION
-- Max 30 confirmation toggles per hour per user
-- Returns JSON: { allowed, reason }
CREATE OR REPLACE FUNCTION public.check_confirmation_rate_limit(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    toggle_count INT;
BEGIN
    -- Count recent confirmations created in last hour
    -- Note: since toggleConfirmation inserts/deletes, we count inserts from created_at
    SELECT COUNT(*) INTO toggle_count
    FROM public.report_confirmations
    WHERE user_id = user_uuid
      AND created_at > NOW() - INTERVAL '1 hour';

    IF toggle_count >= 30 THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'You have reached the maximum number of confirmation actions this hour. Please try again later.'
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'reason', 'OK'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
