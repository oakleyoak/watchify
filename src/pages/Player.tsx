import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { supabase } from '../supabase';

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

const Player = () => {
  const { magnet } = useParams();
  const [resumeTime, setResumeTime] = useState(0);

  useEffect(() => {
    // Fetch resume time from Supabase
    const fetchResumeTime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const decodedMagnet = decodeURIComponent(magnet);
        const torrentId = hashMagnet(decodedMagnet);
        const { data } = await supabase
          .from('user_history')
          .select('progress_seconds')
          .eq('user_id', user.id)
          .eq('torrent_id', torrentId)
          .single();
        if (data) setResumeTime(data.progress_seconds);
      }
    };
    fetchResumeTime();
  }, [magnet]);

  return (
    <div className="container mx-auto p-4">
      <VideoPlayer magnet={decodeURIComponent(magnet)} resumeTime={resumeTime} />
    </div>
  );
};

export default Player;