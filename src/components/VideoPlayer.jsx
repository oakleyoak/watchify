import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

const VideoPlayer = ({ magnet, resumeTime }) => {
  const videoRef = useRef(null);
  const [client, setClient] = useState(null);
  const [torrent, setTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let wtClient;

    const initWebTorrent = async () => {
      try {
        // Load WebTorrent from CDN to avoid build issues
        if (!window.WebTorrent) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        wtClient = new window.WebTorrent();

        wtClient.on('error', (err) => {
          console.error('WebTorrent error:', err);
          setError('Failed to initialize torrent client - falling back to basic player');
          setLoading(false);
        });

        setClient(wtClient);
      } catch (err) {
        console.error('Failed to load WebTorrent:', err);
        setError('WebTorrent not available - using basic video player');
        setLoading(false);
      }
    };

    // Only try to load WebTorrent if we're in a browser environment
    if (typeof window !== 'undefined') {
      initWebTorrent();
    } else {
      setError('Video player not available in this environment');
      setLoading(false);
    }

    return () => {
      if (wtClient) {
        wtClient.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!client || !magnet) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    client.add(magnet, (torrent) => {
      setTorrent(torrent);

      // Find the largest video file
      const videoFiles = torrent.files.filter(file =>
        file.name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
      );

      if (videoFiles.length === 0) {
        setError('No video files found in torrent');
        setLoading(false);
        return;
      }

      const videoFile = videoFiles.reduce((largest, current) =>
        current.length > largest.length ? current : largest
      );

      setFile(videoFile);

      // Create object URL for video
      videoFile.getBlobURL((err, url) => {
        if (err) {
          setError('Failed to load video file');
          setLoading(false);
          return;
        }

        videoRef.current.src = url;
        setLoading(false);

        // Resume from saved position
        if (resumeTime > 0) {
          videoRef.current.currentTime = resumeTime;
        }
      });

      // Update progress
      const updateProgress = () => {
        setProgress(torrent.progress * 100);
        setDownloadSpeed(torrent.downloadSpeed);
        setUploadSpeed(torrent.uploadSpeed);
      };

      torrent.on('download', updateProgress);
      torrent.on('upload', updateProgress);
    });

    return () => {
      if (torrent) {
        torrent.destroy();
        setTorrent(null);
      }
    };
  }, [client, magnet]);

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && videoRef.current && file) {
      await supabase
        .from('user_history')
        .upsert({
          user_id: user.id,
          torrent_id: magnet,
          title: file.name,
          progress_seconds: videoRef.current.currentTime,
          last_watched_at: new Date().toISOString()
        });
    }
  };

  useEffect(() => {
    if (!file) return;

    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [file]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
    return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  return (
    <div className="video-player">
      {loading && <div className="text-center text-white">Loading torrent...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      <div className="relative">
        <video
          ref={videoRef}
          controls
          onTimeUpdate={handleTimeUpdate}
          className="w-full max-h-screen"
          style={{ display: loading ? 'none' : 'block' }}
        />
        {!loading && !error && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-75"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        )}
      </div>
      {!loading && !error && (
        <div className="mt-2 text-white">
          <p>File: {file?.name}</p>
          <p>Size: {file ? (file.length / 1024 / 1024).toFixed(2) : 0} MB</p>
          <p>Progress: {progress.toFixed(2)}%</p>
          <p>Download: {formatSpeed(downloadSpeed)}</p>
          <p>Upload: {formatSpeed(uploadSpeed)}</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;