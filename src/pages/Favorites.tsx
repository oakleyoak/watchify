import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const Favorites = () => {
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading: loading } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const deleteFromFavorites = async (torrent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Hash the magnet URL for database lookup
        const hashMagnet = (magnet: string): string => {
          let hash = 0;
          for (let i = 0; i < magnet.length; i++) {
            const char = magnet.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
          }
          return Math.abs(hash).toString(36);
        };

        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('torrent_id', hashMagnet(torrent.magnet));

        if (error) throw error;

        // Invalidate and refetch the favorites query
        queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
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
            torrent={{ title: item.title, magnet: item.magnet_url, poster_url: item.poster_url }}
            onDelete={deleteFromFavorites}
            showDelete={true}
          />
        ))}
      </div>
    </div>
  );
};

export default Favorites;