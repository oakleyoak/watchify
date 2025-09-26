CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  torrent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, torrent_id) -- Prevent duplicate history entries
);

CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  torrent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, torrent_id) -- Prevent duplicate favorites
);

-- Enable Row Level Security
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_history
CREATE POLICY "Users can view their own history" ON user_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" ON user_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history" ON user_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" ON user_history
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" ON user_favorites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_history_user_id ON user_history(user_id);
CREATE INDEX idx_user_history_torrent_id ON user_history(torrent_id);
CREATE INDEX idx_user_history_last_watched ON user_history(last_watched_at DESC);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_torrent_id ON user_favorites(torrent_id);
CREATE INDEX idx_user_favorites_added_at ON user_favorites(added_at DESC);