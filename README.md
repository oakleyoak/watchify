# Watchify

A torrent magnet search aggregator and video streaming platform built with React, Vite, WebTorrent, and Supabase.

## Setup

1. Clone the repo.
2. Run `npm install`.
3. Set up Supabase:
   - Create a new project at https://supabase.com
   - Go to Settings > API to get your URL and anon key.
   - Update `src/supabase.js` with your credentials.
4. Create the following tables in Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE magnet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- magnet_history
CREATE TABLE magnet_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  magnet_uri TEXT NOT NULL,
  title TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);

-- playback_logs
CREATE TABLE playback_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  magnet_uri TEXT NOT NULL,
  timestamp FLOAT DEFAULT 0,
  filename TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- favorites
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  magnet_uri TEXT NOT NULL,
  title TEXT
);

-- Policies
CREATE POLICY "Users can view own magnet_history" ON magnet_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own magnet_history" ON magnet_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own playback_logs" ON playback_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update own playback_logs" ON playback_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playback_logs" ON playback_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
```

5. Run `npm run dev` to start the development server.

## Features

- Search torrents from public APIs (YTS for movies)
- Stream videos using HTML5 video (mocked for demo; WebTorrent integration requires additional setup)
- Resume playback
- User history and favorites
- Responsive UI with Tailwind CSS

## Deployment

- Push to GitHub.
- Connect to Netlify.
- Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID in GitHub secrets.

## Legal Note

This app is for educational purposes only. Ensure compliance with local laws regarding torrent usage.