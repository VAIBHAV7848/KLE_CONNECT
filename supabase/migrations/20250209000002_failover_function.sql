-- Function to increment failure count
CREATE OR REPLACE FUNCTION increment_failures(provider_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_failures INTEGER;
BEGIN
    UPDATE provider_health 
    SET consecutive_failures = consecutive_failures + 1,
        last_checked = NOW()
    WHERE provider = provider_name
    RETURNING consecutive_failures INTO current_failures;
    
    RETURN COALESCE(current_failures, 1);
END;
$$ LANGUAGE plpgsql;