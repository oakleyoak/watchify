-- Add magnet_url column to store full magnet URLs for streaming
ALTER TABLE user_history ADD COLUMN magnet_url TEXT;
ALTER TABLE user_favorites ADD COLUMN magnet_url TEXT;

-- Update existing records to populate magnet_url with torrent_id (which currently contains magnet URLs)
UPDATE user_history SET magnet_url = torrent_id WHERE magnet_url IS NULL;
UPDATE user_favorites SET magnet_url = torrent_id WHERE magnet_url IS NULL;

-- Make magnet_url NOT NULL after populating existing data
ALTER TABLE user_history ALTER COLUMN magnet_url SET NOT NULL;
ALTER TABLE user_favorites ALTER COLUMN magnet_url SET NOT NULL;