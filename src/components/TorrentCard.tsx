import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

const TorrentCard = ({ torrent, onDelete, showDelete = false }) => {
  const [error, setError] = useState('');

  // Simple hash function for magnet URLs
  const hashMagnet = (magnet: string): string => {
    let hash = 0;
    for (let i = 0; i < magnet.length; i++) {
      const char = magnet.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const addToHistory = async () => {
    try {
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('user_history').upsert({
          user_id: user.id,
          torrent_id: hashMagnet(torrent.magnet),
          magnet_url: torrent.magnet,
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
          torrent_id: hashMagnet(torrent.magnet),
          magnet_url: torrent.magnet,
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
    <motion.article
      className="bg-gray-800 p-4 rounded cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
      }}
      whileTap={{ scale: 0.98 }}
      role="article"
      aria-labelledby={`torrent-title-${torrent.magnet?.slice(-10)}`}
    >
      {torrent.poster_url && (
        <motion.img
          src={torrent.poster_url}
          alt={`Poster for ${torrent.title}`}
          className="w-full h-48 object-cover rounded mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          loading="lazy"
        />
      )}

      <motion.h3
        id={`torrent-title-${torrent.magnet?.slice(-10)}`}
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
        aria-label="Torrent details"
      >
        <p><span className="sr-only">File size: </span>{torrent.size}</p>
        <p><span className="sr-only">Number of seeders: </span>{torrent.seeders}</p>
        {torrent.year && <p><span className="sr-only">Release year: </span>{torrent.year}</p>}
        {torrent.rating && <p><span className="sr-only">Rating: </span>{torrent.rating}/10</p>}
      </motion.div>

      {error && (
        <motion.div
          className="text-red-500 text-sm mt-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        className="flex space-x-2 mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        role="group"
        aria-label="Torrent actions"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to={`/player/${encodeURIComponent(torrent.magnet)}`}
            onClick={addToHistory}
            className="inline-block bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Watch ${torrent.title}`}
          >
            ▶️ Watch
          </Link>
        </motion.div>

        <motion.button
          onClick={addToFavorites}
          className="bg-yellow-600 hover:bg-yellow-700 focus:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`Add ${torrent.title} to favorites`}
          type="button"
        >
          ⭐ Favorite
        </motion.button>

        {showDelete && (
          <motion.button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Delete ${torrent.title} from list`}
            type="button"
          >
            🗑️ Delete
          </motion.button>
        )}
      </motion.div>
    </motion.article>
  );
};

export default TorrentCard;