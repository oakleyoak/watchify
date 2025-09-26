# 🎬 Watchify

A modern, professional torrent streaming desktop application built with React, TypeScript, Electron, and VLC. Stream torrents directly in VLC media player with enterprise-grade video controls, comprehensive accessibility, and robust user management.

![Watchify](https://img.shields.io/badge/Watchify-Desktop_App-blue?style=for-the-badge&logo=video&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)
![Electron](https://img.shields.io/badge/Electron-31.3.1-47848F?style=flat-square&logo=electron)
![VLC](https://img.shields.io/badge/VLC-Integrated-FF7E00?style=flat-square&logo=vlcmediaplayer)

## ✨ Features

### 🎯 Core Functionality
- 🔍 **Intelligent Search**: Search torrents via YTS and Pirate Bay with automatic fallback
- 🎬 **VLC Integration**: Stream torrents directly in VLC media player for optimal performance
- 🧲 **Torrent Streaming**: Direct peer-to-peer streaming with VLC playback
- 👤 **Secure Authentication**: Supabase-powered user management with JWT tokens
- 📚 **Smart History**: Automatic progress tracking with resume functionality
- ❤️ **Favorites System**: Curated collection of saved content
- �️ **Desktop Application**: Native desktop experience with Electron

### 🎥 Professional Video Experience
- **VLC Controls**: Full VLC media player controls and features
- **Advanced Playback**: Hardware acceleration, multiple audio tracks, subtitles
- **Keyboard Shortcuts**: Full keyboard navigation (Space, arrows, F, M, P)
- **Responsive Design**: Optimized for desktop with native window controls
- **Smooth Animations**: Framer Motion-powered transitions

### ♿ Accessibility Excellence
- **WCAG 2.1 AA Compliant**: Full screen reader and keyboard support
- **ARIA Labels**: Comprehensive accessibility attributes
- **Skip Links**: Quick navigation for keyboard users
- **High Contrast**: Automatic adaptation to system preferences
- **Reduced Motion**: Respects user accessibility settings

### 🚀 Modern Architecture
- **Direct API Integration**: Torrent-Search-API runs directly in Electron
- **Type-Safe**: Full TypeScript implementation
- **Optimized Performance**: Code splitting, lazy loading, and caching
- **Error Boundaries**: Graceful error handling throughout
- **Real-time Data**: React Query for intelligent caching

## 🛠️ Tech Stack

### Desktop Framework
- **Electron 31.3.1** - Cross-platform desktop app framework
- **React 18.3.1** - Concurrent features and modern hooks
- **TypeScript 5.9.2** - Type-safe development experience
- **Vite 5.4.8** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.4.14** - Utility-first CSS with custom design system

### Media & Streaming
- **VLC Media Player** - Professional video playback with hardware acceleration
- **Framer Motion 12.23.22** - Production-ready animations
- **Electron IPC** - Secure communication between main and renderer processes

### Backend & Data
- **Supabase** - Authentication, database, and real-time subscriptions
- **TanStack React Query 5.90.2** - Powerful data synchronization
- **React Router 6.26.1** - Declarative client-side routing

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **VLC Media Player** installed on your system
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

5. **Start development**
   ```bash
   npm run dev
   ```

   This will start both the Vite dev server and Electron app concurrently.

## 🎮 Usage Guide

### Basic Operation
1. **Search**: Enter keywords in the search bar
2. **Filter**: Use category and resolution filters
3. **Stream**: Click "Watch with VLC" to start streaming in VLC media player
4. **Controls**: Use VLC's native controls for playback

### VLC Integration
- **Automatic Launch**: VLC opens automatically when you click "Watch with VLC"
- **Hardware Acceleration**: VLC uses GPU acceleration for smooth playback
- **Multiple Formats**: Support for all video formats and codecs
- **Subtitles**: Automatic subtitle detection and loading
- **Audio Tracks**: Multiple audio track selection

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
- **VLC Integration**: Professional video playback with hardware acceleration

## �️ Desktop Application

Watchify runs as a native desktop application with:
- **VLC Integration**: Direct integration with VLC media player
- **Cross-Platform**: Windows, macOS, and Linux support
- **Native Performance**: Hardware-accelerated video playback
- **System Integration**: Native window management and system tray

## ♿ Accessibility

Built with accessibility as a core principle:
- **Screen Reader Support**: Full NVDA, JAWS, and VoiceOver compatibility
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Logical tab order with visible indicators
- **High Contrast**: Automatic system preference detection
- **Reduced Motion**: Respects user motion preferences

## 🚀 Building & Distribution

### Development
```bash
# Start development environment (Vite + Electron)
npm run dev

# Start Vite dev server only
npm run dev:vite

# Start Electron app only
npm run dev:electron
```

### Building for Distribution
```bash
# Build and package for current platform
npm run build:electron

# Build only (no packaging)
npm run build

# Package for distribution (creates installers)
npm run electron:dist

# Package without installer (just the app)
npm run electron:pack
```

### Distribution Files
The build process creates:
- **Windows**: `.exe` installer and portable version
- **macOS**: `.dmg` and `.pkg` installers
- **Linux**: `.AppImage` and `.deb` packages

### Production Configuration
Update your Supabase project settings for production:
```toml
[auth]
site_url = "https://your-domain.com"
additional_redirect_urls = ["https://your-domain.com"]
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
│   ├── ContinueWatching.tsx # Resume playback
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

electron/
├── main.cjs         # Electron main process
└── preload.js       # IPC preload script
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

- **Electron** - Cross-platform desktop app framework
- **VLC Media Player** - Professional video playback
- **Torrent-Search-API** - Multi-provider torrent search
- **Supabase** - Backend-as-a-service platform
- **Framer Motion** - Animation library
- **Tailwind CSS** - CSS framework
- **React & TypeScript** - Modern web development

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

## 🚀 Building & Distribution

### Development
```bash
# Start development environment (Vite + Electron)
npm run dev

# Start Vite dev server only
npm run dev:vite

# Start Electron app only
npm run dev:electron
```

### Building for Distribution
```bash
# Build and package for current platform
npm run build:electron

# Build only (no packaging)
npm run build

# Package for distribution (creates installers)
npm run electron:dist

# Package without installer (just the app)
npm run electron:pack
```

### Distribution Files
The build process creates:
- **Windows**: `.exe` installer and portable version
- **macOS**: `.dmg` and `.pkg` installers
- **Linux**: `.AppImage` and `.deb` packages

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

## Tech Stack

- **Desktop App**: Electron with React 18, Vite, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Torrent Search**: [Torrent-Search-API](https://github.com/JimmyLaurent/torrent-search-api) running directly in Electron
- **Video Playback**: VLC Media Player integration
- **API**: Torrent-Search-API aggregates from 15+ providers (1337x, ThePirateBay, Rarbg, YTS, etc.)
- **Distribution**: Electron Builder (Windows, macOS, Linux)
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