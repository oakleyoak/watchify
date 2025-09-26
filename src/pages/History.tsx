import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const History = () => {
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: history = [], isLoading: loading } = useQuery({
    queryKey: ['user-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const deleteFromHistory = async (torrent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('torrent_id', torrent.magnet || torrent.torrent_id);

        if (error) throw error;

        // Invalidate and refetch the history query
        queryClient.invalidateQueries({ queryKey: ['user-history'] });
      }
    } catch (error) {
      console.error('Failed to delete from history:', error);
      setError('Failed to delete from history');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">History</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p className="text-white mb-4">Loading history...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item, index) => (
          <TorrentCard
            key={index}
            torrent={{ title: item.title, magnet: item.torrent_id, poster_url: item.poster_url }}
            onDelete={deleteFromHistory}
            showDelete={true}
          />
        ))}
      </div>
    </div>
  );
};

export default History;