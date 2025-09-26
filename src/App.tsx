import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Header from './components/Header.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.tsx';
import SkipLinks from './components/SkipLinks.tsx';

// Lazy load page components
const Home = lazy(() => import('./pages/Home.tsx'));
const Player = lazy(() => import('./pages/Player.tsx'));
const History = lazy(() => import('./pages/History.tsx'));
const Favorites = lazy(() => import('./pages/Favorites.tsx'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center animate-fade-in">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="animate-fade-in-delayed">
        Loading...
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <SkipLinks />
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player/:magnet" element={<Player />} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          </Routes>
        </Suspense>
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App;