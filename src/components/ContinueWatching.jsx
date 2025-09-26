import { useState, useEffect } from 'react';
import ResumeButton from './ResumeButton';
import { supabase } from '../supabase';

const ContinueWatching = () => {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('playback_logs')
          .select('magnet_uri, timestamp, filename')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);
        setRecent(data || []);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="mb-4">
      <h2 className="text-2xl font-bold mb-2">Continue Watching</h2>
      <div className="flex space-x-4 overflow-x-auto">
        {recent.map((item, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded min-w-48">
            <p>{item.filename}</p>
            <ResumeButton magnet={item.magnet_uri} resumeTime={item.timestamp} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinueWatching;