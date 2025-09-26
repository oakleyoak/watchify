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
    console.log('Player: Component mounted with magnet param:', magnet);
    
    // Fetch resume time from Supabase
    const fetchResumeTime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const decodedMagnet = decodeURIComponent(magnet);
        console.log('Player: Decoded magnet:', decodedMagnet.substring(0, 50) + '...');
        const torrentId = hashMagnet(decodedMagnet);
        console.log('Player: Hashed torrent ID:', torrentId);
        
        const { data } = await supabase
          .from('user_history')
          .select('progress_seconds')
          .eq('user_id', user.id)
          .eq('torrent_id', torrentId)
          .single();
        if (data) {
          console.log('Player: Found resume time:', data.progress_seconds);
          setResumeTime(data.progress_seconds);
        } else {
          console.log('Player: No resume time found');
        }
      } else {
        console.log('Player: No authenticated user');
      }
    };
    fetchResumeTime();
  }, [magnet]);

  const decodedMagnet = decodeURIComponent(magnet);
  console.log('Player: Rendering VideoPlayer with magnet:', decodedMagnet.substring(0, 50) + '...');

  return (
    <div className="container mx-auto p-4">
      <VideoPlayer magnet={decodedMagnet} resumeTime={resumeTime} />
    </div>
  );
};

export default Player;