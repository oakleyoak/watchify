import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="bg-gray-800 p-4" role="banner">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Watchify - Go to home page"
          >
            Watchify
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4" role="navigation" aria-label="Main navigation" id="navigation">
            <Link
              to="/"
              className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label="Home page"
            >
              Home
            </Link>
            <Link
              to="/history"
              className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label="Watch history"
            >
              History
            </Link>
            <Link
              to="/favorites"
              className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label="Favorite torrents"
            >
              Favorites
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                aria-label="Logout from your account"
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  aria-label="Login to your account"
                >
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="text-green-400 hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                  aria-label="Create a new account"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4"
            role="navigation"
            aria-label="Mobile navigation"
            id="mobile-navigation"
          >
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Home page"
              >
                Home
              </Link>
              <Link
                to="/history"
                className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Watch history"
              >
                History
              </Link>
              <Link
                to="/favorites"
                className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Favorite torrents"
              >
                Favorites
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 text-left"
                  aria-label="Logout from your account"
                >
                  Logout
                </button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                    className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 text-left"
                    aria-label="Login to your account"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { handleSignup(); setMobileMenuOpen(false); }}
                    className="text-green-400 hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 text-left"
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        setMode={setAuthMode}
      />
    </>
  );
};

export default Header;