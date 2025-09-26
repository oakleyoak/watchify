# 🎬 Watchify

A modern, feature-rich torrent streaming platform built with cutting-edge web technologies. Stream torrents directly in your browser with professional-grade video controls, PWA capabilities, and comprehensive accessibility support.

![Watchify](https://img.shields.io/badge/Watchify-Streaming_Platform-blue?style=for-the-badge&logo=video&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.8-646CFF?style=flat-square&logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)

## ✨ Features

### 🎯 Core Features
- 🔍 **Advanced Torrent Search**: Search torrents with category, resolution, and seeder filters
- 🎬 **Direct Streaming**: Stream torrents instantly using WebTorrent technology
- 👤 **User Authentication**: Secure signup/login with Supabase Auth
- 📚 **Smart History**: Automatic progress tracking and resume functionality
- ❤️ **Favorites System**: Save and manage your favorite torrents
- 📱 **Progressive Web App**: Install as a native app with offline capabilities

### 🎥 Professional Video Controls
- **Playback Speed**: 0.25x to 2x speed control with visual indicators
- **Picture-in-Picture**: Native PiP mode for multitasking
- **Volume Controls**: Custom volume slider with mute/unmute
- **Seeking**: Click-to-seek on progress bar with precise control
- **Skip Controls**: 10-second forward/backward skip buttons
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Auto-hiding Controls**: Controls fade out during playback for immersive viewing

### ♿ Accessibility Excellence
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility with focus management
- **Skip Links**: Quick navigation for keyboard users
- **High Contrast**: Automatic high contrast mode support
- **Reduced Motion**: Respects user motion preferences
- **Semantic HTML**: Proper document structure for assistive technologies

### 🚀 Modern Web Features
- **TypeScript**: Full type safety and enhanced developer experience
- **React Query**: Intelligent data fetching and caching
- **Error Boundaries**: Graceful error handling with fallback UI
- **Lazy Loading**: Code splitting for optimal performance
- **Framer Motion**: Smooth animations and transitions
- **Service Worker**: Offline caching and background sync
- **Responsive Design**: Perfect on all devices and screen sizes

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern React with concurrent features
- **TypeScript 5.9.2** - Type-safe JavaScript
- **Vite 5.4.8** - Lightning-fast build tool
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **Framer Motion 12.23.22** - Production-ready animations
- **React Router 6.26.1** - Declarative routing
- **TanStack React Query 5.90.2** - Powerful data synchronization

### Backend & Services
- **Supabase** - Authentication, database, and real-time features
- **WebTorrent** - Client-side torrent streaming
- **YTS API** - Torrent search and metadata

### Development & Build
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Sharp** - Image processing for PWA icons
- **Vite Plugin Node Polyfills** - Node.js compatibility

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/oakleyoak/watchify.git
   cd watchify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your URL and anon key
   - Create `.env.local` with your credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up database tables**
   Run these SQL commands in your Supabase SQL Editor:

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

5. **Generate PWA icons** (optional)
   ```bash
   npm run generate-icons
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🎮 Usage

### Basic Usage
1. Search for torrents using the search bar
2. Filter by category, resolution, and minimum seeders
3. Click "Watch" to start streaming
4. Use the advanced video controls for the best experience

### Keyboard Shortcuts
- **Space**: Play/Pause
- **←/→**: Seek backward/forward 10 seconds
- **↑/↓**: Volume up/down
- **F**: Toggle fullscreen
- **M**: Toggle mute
- **P**: Toggle picture-in-picture

### PWA Installation
1. The app will prompt you to install when ready
2. Or use the browser's install option
3. Enjoy offline access and native app experience

## 📱 Progressive Web App

Watchify is a fully-featured PWA with:
- **Offline Caching**: Core functionality works offline
- **Installable**: Add to home screen on mobile/desktop
- **Background Sync**: Sync actions when back online
- **Push Notifications**: Ready for future notification features
- **Native App Feel**: Standalone experience

## ♿ Accessibility

Watchify is built with accessibility as a core principle:
- **WCAG 2.1 AA Compliant**: Meets web accessibility standards
- **Screen Reader Friendly**: Full NVDA/JAWS support
- **Keyboard Accessible**: Complete keyboard navigation
- **High Contrast Support**: Automatic adaptation
- **Focus Management**: Logical tab order and focus indicators

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Manual Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

## 📊 Performance

- **Bundle Size**: Optimized with code splitting
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Automatic WebP conversion
- **Caching**: Intelligent service worker caching
- **Core Web Vitals**: Optimized for speed and UX

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run generate-icons # Generate PWA icons
```

### Project Structure
```
src/
├── components/       # Reusable UI components
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   ├── TorrentCard.tsx
│   ├── VideoPlayer.tsx
│   ├── PWAInstallPrompt.tsx
│   ├── SkipLinks.tsx
│   └── ErrorBoundary.tsx
├── pages/           # Page components
│   ├── Home.tsx
│   ├── Player.tsx
│   ├── History.tsx
│   └── Favorites.tsx
├── supabase.ts      # Supabase client
├── main.tsx         # App entry point
└── index.css        # Global styles
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is for educational purposes only. Ensure compliance with local laws regarding torrent usage.

## 🙏 Acknowledgments

- [WebTorrent](https://webtorrent.io/) for client-side torrent streaming
- [YTS](https://yts.mx/) for torrent search API
- [Supabase](https://supabase.com/) for backend services
- [Framer Motion](https://framer.com/motion) for animations
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

**Built with ❤️ using modern web technologies**

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