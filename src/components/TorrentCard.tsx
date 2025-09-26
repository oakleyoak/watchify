import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

const TorrentCard = ({ torrent, onDelete, showDelete = false }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
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

  return (
    <motion.article
      className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}
      whileTap={{ scale: 0.98 }}
      role="article"
      aria-labelledby={`torrent-title-${torrent.magnet?.slice(-10)}`}
    >
      {torrent.poster_url && (
        <motion.div
          className="relative overflow-hidden rounded-xl mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <motion.img
            src={torrent.poster_url}
            alt={`Poster for ${torrent.title}`}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      )}

      <motion.h3
        id={`torrent-title-${torrent.magnet?.slice(-10)}`}
        className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {torrent.title}
      </motion.h3>

      <motion.div
        className="space-y-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        aria-label="Torrent details"
      >
        <div className="flex items-center text-slate-300 text-sm">
          <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{torrent.size}</span>
        </div>
        <div className="flex items-center text-slate-300 text-sm">
          <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{torrent.seeders} seeders</span>
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="text-red-400 text-sm mb-3 p-2 bg-red-900/20 rounded-lg border border-red-800/50"
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
        className="flex flex-col space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        role="group"
        aria-label="Torrent actions"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            to={`/player/${encodeURIComponent(torrent.magnet)}`}
            onClick={addToHistory}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg hover:shadow-xl"
            aria-label={`Watch ${torrent.title}`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Watch Now
          </Link>
        </motion.div>
      </motion.div>
    </motion.article>
  );
};

export default TorrentCard;