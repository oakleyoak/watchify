import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

const TorrentCard = ({ torrent, onDelete, showDelete = false }) => {
  const [error, setError] = useState('');

  const addToHistory = async () => {
    try {
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('user_history').upsert({
          user_id: user.id,
          torrent_id: torrent.magnet,
          title: torrent.title,
          poster_url: torrent.poster_url,
          progress_seconds: 0,
          last_watched_at: new Date().toISOString()
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to add to history:', error);
      setError('Failed to add to history');
    }
  };

  const addToFavorites = async () => {
    try {
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('user_favorites').upsert({
          user_id: user.id,
          torrent_id: torrent.magnet,
          title: torrent.title,
          poster_url: torrent.poster_url
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      setError('Failed to add to favorites');
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        setError('');
        await onDelete(torrent);
      } catch (error) {
        console.error('Failed to delete:', error);
        setError('Failed to delete');
      }
    }
  };

  return (
    <motion.div
      className="bg-gray-800 p-4 rounded cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      {torrent.poster_url && (
        <motion.img
          src={torrent.poster_url}
          alt={torrent.title}
          className="w-full h-48 object-cover rounded mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        />
      )}
      <motion.h3
        className="text-lg font-bold mb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {torrent.title}
      </motion.h3>
      <motion.div
        className="text-sm text-gray-300 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <p>Size: {torrent.size}</p>
        <p>Seeders: {torrent.seeders}</p>
      </motion.div>
      {error && (
        <motion.p
          className="text-red-500 text-sm mt-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      <motion.div
        className="flex space-x-2 mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to={`/player/${encodeURIComponent(torrent.magnet)}`}
            onClick={addToHistory}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Watch
          </Link>
        </motion.div>
        <motion.button
          onClick={addToFavorites}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Favorite
        </motion.button>
        {showDelete && (
          <motion.button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TorrentCard;