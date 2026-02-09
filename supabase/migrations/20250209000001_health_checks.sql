-- Provider Health Checks Table
CREATE TABLE IF NOT EXISTS provider_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time_ms INTEGER,
    error_message TEXT,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    consecutive_failures INTEGER DEFAULT 0
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health(provider);
CREATE INDEX IF NOT EXISTS idx_provider_health_status ON provider_health(status);

-- RLS Policy
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for provider_health" 
    ON provider_health 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Auto-failover configuration table
CREATE TABLE IF NOT EXISTS failover_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_provider TEXT NOT NULL,
    fallback_order TEXT[] NOT NULL, -- Array of providers in failover order
    max_failures_before_failover INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default failover configuration
INSERT INTO failover_config (primary_provider, fallback_order, max_failures_before_failover)
VALUES 
    ('OPENAI_API_KEY', ARRAY['GROQ_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'], 3),
    ('GROQ_API_KEY', ARRAY['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'], 3),
    ('GEMINI_API_KEY', ARRAY['OPENAI_API_KEY', 'GROQ_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'], 3),
    ('ANTHROPIC_API_KEY', ARRAY['OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'MISTRAL_API_KEY'], 3),
    ('MISTRAL_API_KEY', ARRAY['OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY'], 3)
ON CONFLICT (primary_provider) DO NOTHING;