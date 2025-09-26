import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AuthModal from './AuthModal';

const Header = () => {
  const [user, setUser] = useState(null);
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
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Watchify</Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            <Link to="/" className="hover:text-blue-400">Home</Link>
            <Link to="/history" className="hover:text-blue-400">History</Link>
            <Link to="/favorites" className="hover:text-blue-400">Favorites</Link>
            {user ? (
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300">Logout</button>
            ) : (
              <>
                <button onClick={handleLogin} className="text-blue-400 hover:text-blue-300">Login</button>
                <button onClick={handleSignup} className="text-green-400 hover:text-green-300">Sign Up</button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            ☰
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="flex flex-col space-y-2">
              <Link to="/" className="hover:text-blue-400" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/history" className="hover:text-blue-400" onClick={() => setMobileMenuOpen(false)}>History</Link>
              <Link to="/favorites" className="hover:text-blue-400" onClick={() => setMobileMenuOpen(false)}>Favorites</Link>
              {user ? (
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-left">Logout</button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <button onClick={() => { handleLogin(); setMobileMenuOpen(false); }} className="text-blue-400 hover:text-blue-300 text-left">Login</button>
                  <button onClick={() => { handleSignup(); setMobileMenuOpen(false); }} className="text-green-400 hover:text-green-300 text-left">Sign Up</button>
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