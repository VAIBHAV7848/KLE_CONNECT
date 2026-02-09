-- AI Usage Analytics Table
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    response_time_ms INTEGER,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    error_message TEXT,
    route_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_stats(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_stats(user_id);

-- RLS Policy
ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for ai_usage_stats" 
    ON ai_usage_stats 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Function to clean old analytics data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_usage_stats 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup trigger (optional - run via cron job)
-- Can be scheduled with pg_cron if available
