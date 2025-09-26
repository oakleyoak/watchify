import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

  const decodedMagnet = decodeURIComponent(magnet);
  const magnetHash = hashMagnet(decodedMagnet);

  useEffect(() => {
    console.log('Player: Component mounted with magnet param:', magnet);
    
    // Fetch resume time from Supabase
    const fetchResumeTime = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Player: Auth error:', authError);
          return;
        }
        
        if (user) {
          console.log('Player: Decoded magnet:', decodedMagnet.substring(0, 50) + '...');
          console.log('Player: Hashed torrent ID:', magnetHash);
          
          const { data, error } = await supabase
            .from('user_history')
            .select('progress_seconds')
            .eq('user_id', user.id)
            .eq('torrent_id', magnetHash)
            .order('last_watched_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error('Player: Supabase error:', error);
          } else if (data && data.length > 0) {
            console.log('Player: Found resume time:', data[0].progress_seconds);
            setResumeTime(data[0].progress_seconds);
          } else {
            console.log('Player: No resume time found');
          }
        } else {
          console.log('Player: No authenticated user');
        }
      } catch (error) {
        console.error('Player: Failed to fetch resume time:', error);
      }
    };
    fetchResumeTime();
  }, [magnet, decodedMagnet, magnetHash]);

  console.log('Player: Rendering VideoPlayer with magnet:', decodedMagnet.substring(0, 50) + '...');

  return (
    <div className="container mx-auto p-4">
      <VideoPlayer magnet={decodedMagnet} magnetHash={magnetHash} resumeTime={resumeTime} />
    </div>
  );
};

export default Player;