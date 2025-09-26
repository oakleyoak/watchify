import { useState, useEffect } from 'react';
import ResumeButton from './ResumeButton';
import { supabase } from '../supabase';

const ContinueWatching = () => {
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('user_history')
            .select('torrent_id, title, poster_url, progress_seconds, last_watched_at')
            .eq('user_id', user.id)
            .order('last_watched_at', { ascending: false })
            .limit(5);

          if (error) throw error;
          setRecent(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent videos:', error);
        setError('Failed to load recent videos');
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="mb-4">
      <h2 className="text-2xl font-bold mb-2">Continue Watching</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="flex space-x-4 overflow-x-auto">
        {recent.map((item, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded min-w-48">
            <p>{item.title}</p>
            <ResumeButton magnet={item.torrent_id} resumeTime={item.progress_seconds} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinueWatching;