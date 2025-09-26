import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { supabase } from '../supabase';

const Player = () => {
  const { magnet } = useParams();
  const [resumeTime, setResumeTime] = useState(0);

  useEffect(() => {
    // Fetch resume time from Supabase
    const fetchResumeTime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_history')
          .select('progress_seconds')
          .eq('user_id', user.id)
          .eq('torrent_id', decodeURIComponent(magnet))
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