import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="bg-gray-800 p-4 rounded">
      <h3 className="text-lg font-bold">{torrent.title}</h3>
      <p>Size: {torrent.size}</p>
      <p>Seeders: {torrent.seeders}</p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex space-x-2 mt-2">
        <Link to={`/player/${encodeURIComponent(torrent.magnet)}`} onClick={addToHistory} className="text-blue-400 hover:text-blue-300">Watch</Link>
        <button onClick={addToFavorites} className="text-yellow-400 hover:text-yellow-300">Favorite</button>
        {showDelete && (
          <button onClick={handleDelete} className="text-red-400 hover:text-red-300">Delete</button>
        )}
      </div>
    </div>
  );
};

export default TorrentCard;