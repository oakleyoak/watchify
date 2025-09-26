import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Lazy load page components
const Home = lazy(() => import('./pages/Home.tsx'));
const Player = lazy(() => import('./pages/Player.tsx'));
const History = lazy(() => import('./pages/History.tsx'));
const Favorites = lazy(() => import('./pages/Favorites.tsx'));

// Loading component
const PageLoader = () => (
  <motion.div
    className="min-h-screen bg-gray-900 text-white flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="text-center">
      <motion.div
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      ></motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Loading...
      </motion.p>
    </div>
  </motion.div>
);

function App() {
  return (
    <Router>
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
      </div>
    </Router>
  );
}

export default App;