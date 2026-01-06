-- Create rate_limits table for rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
  v_reset_time TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Insert or update rate limit record
  INSERT INTO rate_limits (key, count, reset_time)
  VALUES (
    p_key,
    1,
    v_now + (p_window || ' milliseconds')::INTERVAL
  )
  ON CONFLICT (key) DO UPDATE
  SET 
    count = CASE
      WHEN rate_limits.reset_time < v_now THEN 1
      ELSE rate_limits.count + 1
    END,
    reset_time = CASE
      WHEN rate_limits.reset_time < v_now 
      THEN v_now + (p_window || ' milliseconds')::INTERVAL
      ELSE rate_limits.reset_time
    END
  RETURNING count, reset_time INTO v_count, v_reset_time;
  
  -- Calculate remaining and reset time
  DECLARE
    v_remaining INTEGER := GREATEST(0, p_max - v_count);
    v_reset_in_ms INTEGER := EXTRACT(EPOCH FROM (v_reset_time - v_now))::INTEGER * 1000;
  BEGIN
    -- Return result
    RETURN jsonb_build_object(
      'allowed', v_count <= p_max,
      'remaining', v_remaining,
      'resetIn', v_reset_in_ms
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired rate limits (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE reset_time < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO authenticated;











