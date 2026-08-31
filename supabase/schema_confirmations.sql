-- Create the report_confirmations table
CREATE TABLE IF NOT EXISTS public.report_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    -- Ensure a user can only confirm a specific report once
    UNIQUE(report_id, user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.report_confirmations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read confirmations
CREATE POLICY "Confirmations are viewable by everyone"
    ON public.report_confirmations FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert their own confirmations
CREATE POLICY "Users can insert their own confirmations"
    ON public.report_confirmations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own confirmations
CREATE POLICY "Users can delete their own confirmations"
    ON public.report_confirmations FOR DELETE
    USING (auth.uid() = user_id);

-- Create an index to quickly count confirmations per report
CREATE INDEX idx_report_confirmations_report_id ON public.report_confirmations(report_id);
