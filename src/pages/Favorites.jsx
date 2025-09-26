import { useState, useEffect } from 'react';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('*')
            .eq('user_id', user.id)
            .order('added_at', { ascending: false });

          if (error) throw error;
          setFavorites(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
        setError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const deleteFromFavorites = async (torrent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('torrent_id', torrent.magnet || torrent.torrent_id);

        if (error) throw error;

        // Remove from local state
        setFavorites(prev => prev.filter(item => item.torrent_id !== (torrent.magnet || torrent.torrent_id)));
      }
    } catch (error) {
      console.error('Failed to delete from favorites:', error);
      setError('Failed to delete from favorites');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Favorites</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p className="text-white mb-4">Loading favorites...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((item, index) => (
          <TorrentCard
            key={index}
            torrent={{ title: item.title, magnet: item.torrent_id, poster_url: item.poster_url }}
            onDelete={deleteFromFavorites}
            showDelete={true}
          />
        ))}
      </div>
    </div>
  );
};

export default Favorites;