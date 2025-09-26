import { useEffect, useRef, useState } from 'react';
// import WebTorrent from 'webtorrent';
import { supabase } from '../supabase';

const VideoPlayer = ({ magnet, resumeTime }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState('sample.mp4');
  const [fileSize, setFileSize] = useState(100000000); // 100MB
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Mock torrent loading
    setTimeout(() => {
      setLoading(false);
      if (resumeTime > 0) {
        videoRef.current.currentTime = resumeTime;
      }
    }, 2000);

    const saveProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && videoRef.current) {
        await supabase
          .from('playback_logs')
          .upsert({
            user_id: user.id,
            magnet_uri: magnet,
            timestamp: videoRef.current.currentTime,
            filename: fileName,
            updated_at: new Date().toISOString()
          });
      }
    };

    const interval = setInterval(saveProgress, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [magnet, resumeTime, fileName]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  return (
    <div className="video-player">
      {loading && <div className="text-center">Loading torrent...</div>}
      <video
        ref={videoRef}
        controls
        onTimeUpdate={handleTimeUpdate}
        className="w-full"
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Sample video
      />
      <div className="mt-2">
        <p>File: {fileName}</p>
        <p>Size: {(fileSize / 1024 / 1024).toFixed(2)} MB</p>
        <p>Progress: {progress.toFixed(2)}%</p>
      </div>
    </div>
  );
};

export default VideoPlayer;