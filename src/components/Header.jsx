import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const Header = () => {
  const [user, setUser] = useState(null);

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

  const handleLogin = async () => {
    await supabase.auth.signInWithPassword({
      email: prompt('Email:'),
      password: prompt('Password:'),
    });
  };

  const handleSignup = async () => {
    const email = prompt('Email:');
    const password = prompt('Password:');
    await supabase.auth.signUp({ email, password });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Watchify</Link>
        <nav className="flex space-x-4">
          <Link to="/">Home</Link>
          <Link to="/history">History</Link>
          <Link to="/favorites">Favorites</Link>
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <button onClick={handleLogin}>Login</button>
              <button onClick={handleSignup}>Signup</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;