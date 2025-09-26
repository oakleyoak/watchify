import { useState, useEffect } from 'react';
import TorrentCard from '../components/TorrentCard';
import { supabase } from '../supabase';

const History = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('magnet_history')
          .select('*')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false });
        setHistory(data || []);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">History</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item, index) => (
          <TorrentCard key={index} torrent={{ title: item.title, magnet: item.magnet_uri }} />
        ))}
      </div>
    </div>
  );
};

export default History;