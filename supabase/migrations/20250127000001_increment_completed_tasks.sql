-- Function to increment completed tasks count for a user
CREATE OR REPLACE FUNCTION increment_completed_tasks(user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET completed_tasks = completed_tasks + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_completed_tasks(TEXT) TO authenticated, anon;










