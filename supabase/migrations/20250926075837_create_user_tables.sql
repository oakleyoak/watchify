CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  torrent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_seconds INTEGER DEFAULT 0
);

CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  torrent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);