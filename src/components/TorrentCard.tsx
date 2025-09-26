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
};

export default TorrentCard;