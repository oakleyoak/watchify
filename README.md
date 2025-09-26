# 🎬 Watchify

A modern, professional torrent streaming platform built with React, TypeScript, and cutting-edge web technologies. Stream torrents directly in your browser with enterprise-grade video controls, comprehensive accessibility, and robust user management.

![Watchify](https://img.shields.io/badge/Watchify-Streaming_Platform-blue?style=for-the-badge&logo=video&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.8-646CFF?style=flat-square&logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C46A?style=flat-square&logo=netlify)

## ✨ Features

### 🎯 Core Functionality
- 🔍 **Intelligent Search**: Search torrents via YTS and Pirate Bay with automatic fallback
- 🎬 **Dual Streaming**: Stream torrents via WebTorrent OR watch YouTube videos directly
- 🧲 **WebTorrent Integration**: Direct peer-to-peer streaming in the browser
- 👤 **Secure Authentication**: Supabase-powered user management with JWT tokens
- 📚 **Smart History**: Automatic progress tracking with resume functionality
- ❤️ **Favorites System**: Curated collection of saved content
- 📱 **Progressive Web App**: Installable with offline capabilities

### 🎥 Professional Video Experience
- **Advanced Controls**: Playback speed (0.25x-2x), picture-in-picture, custom volume
- **Precise Seeking**: Click-to-seek with visual progress indicators
- **Keyboard Shortcuts**: Full keyboard navigation (Space, arrows, F, M, P)
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion-powered transitions

### ♿ Accessibility Excellence
- **WCAG 2.1 AA Compliant**: Full screen reader and keyboard support
- **ARIA Labels**: Comprehensive accessibility attributes
- **Skip Links**: Quick navigation for keyboard users
- **High Contrast**: Automatic adaptation to system preferences
- **Reduced Motion**: Respects user accessibility settings

### 🚀 Modern Architecture
- **Serverless Backend**: Netlify Functions for API proxying
- **Type-Safe**: Full TypeScript implementation
- **Optimized Performance**: Code splitting, lazy loading, and caching
- **Error Boundaries**: Graceful error handling throughout
- **Real-time Data**: React Query for intelligent caching

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3.1** - Concurrent features and modern hooks
- **TypeScript 5.9.2** - Type-safe development experience
- **Vite 5.4.8** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.4.14** - Utility-first CSS with custom design system

### State & Data Management
- **TanStack React Query 5.90.2** - Powerful data synchronization
- **Supabase** - Authentication, database, and real-time subscriptions
- **React Router 6.26.1** - Declarative client-side routing

### Media & Streaming
- **WebTorrent** - Client-side torrent streaming
- **Framer Motion 12.23.22** - Production-ready animations
- **HTML5 Video API** - Native video controls with custom overlay

### Development & Quality
- **ESLint** - Code linting and consistency
- **PostCSS** - CSS processing and optimization
- **Sharp** - PWA icon generation
- **Vite Plugin Node Polyfills** - Node.js compatibility in browser

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Supabase account** for backend services
- **Git** for version control

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

3. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API
   - Create `.env.local`:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Set up database schema**
   Run these SQL commands in your Supabase SQL Editor:

   ```sql
   -- User watch history
   CREATE TABLE user_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     torrent_id TEXT NOT NULL,
     title TEXT NOT NULL,
     poster_url TEXT,
     last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     progress_seconds INTEGER DEFAULT 0,
     UNIQUE(user_id, torrent_id)
   );

   -- User favorites
   CREATE TABLE user_favorites (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     torrent_id TEXT NOT NULL,
     title TEXT NOT NULL,
     poster_url TEXT,
     added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, torrent_id)
   );
   ```

5. **Generate PWA icons** (optional)
   ```bash
   npm run generate-icons
   ```

6. **Start development**
   ```bash
   npm run dev
   ```

## 🎮 Usage Guide

### Basic Operation
1. **Search**: Enter keywords in the search bar
2. **Filter**: Use category and resolution filters
3. **Stream**: Click "Watch" to start streaming
4. **Controls**: Use video controls or keyboard shortcuts

### Keyboard Shortcuts
- **Space** - Play/Pause toggle
- **←/→** - Skip 10 seconds backward/forward
- **↑/↓** - Volume up/down
- **F** - Toggle fullscreen
- **M** - Toggle mute
- **P** - Toggle picture-in-picture

### User Features
- **Sign Up/Login**: Create account to access personal features
- **History**: Automatic progress tracking across sessions
- **Favorites**: Save content for quick access
- **PWA**: Install as native app for enhanced experience

## 📱 Progressive Web App

Watchify is a fully-featured PWA with:
- **Offline Access**: Core functionality works without internet
- **Native Installation**: Add to home screen on any device
- **Background Sync**: Actions sync when connection restored
- **App-like Experience**: Standalone operation with native feel

## ♿ Accessibility

Built with accessibility as a core principle:
- **Screen Reader Support**: Full NVDA, JAWS, and VoiceOver compatibility
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Logical tab order with visible indicators
- **High Contrast**: Automatic system preference detection
- **Reduced Motion**: Respects user motion preferences

## 🚀 Deployment

### Netlify (Recommended)
1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Manual Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

### Production Configuration
Update your Supabase project settings for production:
```toml
[auth]
site_url = "https://your-netlify-site.netlify.app"
additional_redirect_urls = ["https://your-netlify-site.netlify.app"]
```

## 📊 Performance & Quality

- **Bundle Optimization**: Code splitting and lazy loading
- **Image Processing**: Automatic WebP conversion and optimization
- **Caching Strategy**: Intelligent service worker caching
- **Core Web Vitals**: Optimized for speed and user experience
- **Error Boundaries**: Graceful error handling and recovery

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run generate-icons # Generate PWA icons
```

### Project Structure
```
src/
├── components/       # Reusable UI components
│   ├── Header.tsx           # Navigation and branding
│   ├── SearchBar.tsx        # Search interface
│   ├── TorrentCard.tsx      # Content cards
│   ├── VideoPlayer.tsx      # Media player
│   ├── PWAInstallPrompt.tsx # PWA installation
│   ├── ProtectedRoute.tsx   # Auth protection
│   ├── ErrorBoundary.tsx    # Error handling
│   └── SkipLinks.tsx        # Accessibility
├── pages/           # Route components
│   ├── Home.tsx            # Main search page
│   ├── Player.tsx          # Video player page
│   ├── History.tsx         # Watch history
│   └── Favorites.tsx       # Saved content
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── supabase.ts      # Database client
├── main.tsx         # Application entry
└── index.css        # Global styles

netlify/
└── functions/       # Serverless functions
    └── search.js           # Torrent search API
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain accessibility standards
- Add tests for new features
- Update documentation
- Follow conventional commit messages

## 📄 License & Legal

**Educational Purpose Only**: This project is for educational and demonstration purposes. Users are responsible for complying with local laws regarding torrent usage and copyright regulations.

## 🙏 Acknowledgments

- **WebTorrent** - Client-side torrent streaming technology
- **YTS & Pirate Bay** - Torrent search APIs
- **Supabase** - Backend-as-a-service platform
- **Framer Motion** - Animation library
- **Tailwind CSS** - CSS framework
- **Netlify** - Hosting and serverless platform

---

**Built with ❤️ using modern web technologies**

*Watchify - Stream torrents professionally*

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

### ⚠️ Important: Update Supabase Configuration for Production

Before deploying, you must update the Supabase configuration to use your production Netlify URL:

1. **Get your Netlify site URL** (e.g., `https://your-site-name.netlify.app`)
2. **Update `supabase/config.toml`**:
   ```toml
   [auth]
   site_url = "https://your-netlify-site.netlify.app"
   additional_redirect_urls = ["https://your-netlify-site.netlify.app"]
   ```
3. **Deploy the updated configuration** to Supabase:
   ```bash
   supabase db push
   ```

This ensures that Supabase authentication redirects work correctly in production instead of using localhost URLs.

### 🔧 Netlify Functions

The app uses Netlify Functions to run Torrent-Search-API server-side:
- **Function**: `netlify/functions/search.js`
- **Purpose**: Provides browser-compatible torrent search using Torrent-Search-API
- **CORS**: Properly configured for cross-origin requests

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (Auth + Database) + Netlify Functions
- **Torrent Search**: [Torrent-Search-API](https://github.com/JimmyLaurent/torrent-search-api) via Netlify Functions
- **Streaming**: WebTorrent (loaded from CDN)
- **API**: Torrent-Search-API aggregates from 15+ providers (1337x, ThePirateBay, Rarbg, YTS, etc.)
- **Deployment**: Netlify (with serverless functions)
```

5. Run `npm run dev` to start the development server.

## Features

- 🔍 **Advanced Torrent Search**: Search across 15+ torrent providers simultaneously (1337x, ThePirateBay, Rarbg, YTS, Torrent9, etc.)
- 🎬 **Stream Videos Directly**: HTML5 video player with WebTorrent integration
- ⏯️ **Professional Video Controls**: Playback speed, PiP mode, custom controls, keyboard shortcuts
- 🔐 **User Authentication**: Secure login/signup with Supabase
- 📚 **Watch History & Favorites**: Track your viewing history and save favorite torrents
- 📱 **PWA Support**: Install as native app with offline capabilities
- ♿ **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- 🎨 **Modern UI**: Responsive design with dark theme and smooth animations

## Deployment

- Push to GitHub.
- Connect to Netlify.
- Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID in GitHub secrets.

## Legal Note

This app is for educational purposes only. Ensure compliance with local laws regarding torrent usage.