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
  const [useExternalPlayer, setUseExternalPlayer] = useState(false);

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

  const handleOpenInVLC = () => {
    // Try to open in VLC using magnet protocol
    window.open(decodedMagnet, '_blank');
  };

  const handleCopyMagnet = async () => {
    try {
      await navigator.clipboard.writeText(decodedMagnet);
      alert('Magnet link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy magnet link:', err);
      // Fallback: select the text
      const textArea = document.createElement('textarea');
      textArea.value = decodedMagnet;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Magnet link copied to clipboard!');
    }
  };

  console.log('Player: Rendering with magnet:', decodedMagnet.substring(0, 50) + '...');

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Video Player</h1>
        
        {/* Player Options */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Playback Options</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setUseExternalPlayer(false)}
              className={`px-4 py-2 rounded ${!useExternalPlayer ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              In-Browser Player
            </button>
            <button
              onClick={() => setUseExternalPlayer(true)}
              className={`px-4 py-2 rounded ${useExternalPlayer ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              External Player (VLC)
            </button>
          </div>

          {useExternalPlayer ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open this torrent in VLC or your preferred media player:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenInVLC}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Open in VLC
                </button>
                <button
                  onClick={handleCopyMagnet}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Copy Magnet Link
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Magnet: {decodedMagnet.substring(0, 100)}...
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside">
                  <li>Make sure VLC is installed on your system</li>
                  <li>VLC should automatically handle magnet links</li>
                  <li>If not, copy the magnet link and paste it in VLC (Media → Open Network Stream)</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Playing video directly in your browser using WebTorrent.
            </p>
          )}
        </div>
      </div>

      {!useExternalPlayer && (
        <VideoPlayer magnet={decodedMagnet} magnetHash={magnetHash} resumeTime={resumeTime} />
      )}
    </div>
  );
};

export default Player;