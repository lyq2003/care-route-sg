-- Add location tracking columns to route_history table
ALTER TABLE route_history 
ADD COLUMN IF NOT EXISTS user_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS user_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy VARCHAR(20),
ADD COLUMN IF NOT EXISTS location_permission VARCHAR(20);

-- Add indexes for location queries
CREATE INDEX IF NOT EXISTS idx_route_history_location ON route_history(user_latitude, user_longitude);
CREATE INDEX IF NOT EXISTS idx_route_history_location_permission ON route_history(location_permission);

-- Add comments for documentation
COMMENT ON COLUMN route_history.user_latitude IS 'User latitude when route was completed';
COMMENT ON COLUMN route_history.user_longitude IS 'User longitude when route was completed';
COMMENT ON COLUMN route_history.location_accuracy IS 'Accuracy level of location data (high, medium, low)';
COMMENT ON COLUMN route_history.location_permission IS 'Location permission status (granted, denied, prompt, unknown)';
