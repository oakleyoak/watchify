import { useState, useEffect } from 'react';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id);
        setFavorites(data || []);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Favorites</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((item, index) => (
          <TorrentCard key={index} torrent={{ title: item.title, magnet: item.magnet_uri }} />
        ))}
      </div>
    </div>
  );
};

export default Favorites;