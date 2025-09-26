# Watchify

A torrent magnet search aggregator and video streaming platform built with React, Vite, WebTorrent, and Supabase.

## Features

- 🔍 **Torrent Search**: Search torrents using YTS API with advanced filters
- 🎬 **Video Streaming**: Stream torrents directly in your browser using WebTorrent
- 👤 **User Authentication**: Sign up/login with Supabase Auth
- 📚 **Watch History**: Track your viewing progress and resume where you left off
- ❤️ **Favorites**: Save your favorite torrents
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Protected Routes**: History and favorites require authentication

## Setup

1. Clone the repo.
2. Run `npm install`.
3. Set up Supabase:
   - Create a new project at https://supabase.com
   - Go to Settings > API to get your URL and anon key.
   - Update `.env.local` with your credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
4. Create the database tables in Supabase SQL Editor:

```sql
-- User History Table
CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  torrent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_seconds INTEGER DEFAULT 0
);

-- User Favorites Table
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  torrent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

5. Run `npm run dev` to start the development server.

## Deployment

The app is configured for deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Streaming**: WebTorrent (loaded from CDN)
- **API**: YTS.mx API for torrent search
- **Deployment**: Netlify
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