import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabase';

const VideoPlayer = ({ magnet, resumeTime }) => {
  const videoRef = useRef(null);
  const [client, setClient] = useState(null);
  const [torrent, setTorrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPiP, setIsPiP] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const controlsTimeoutRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  const changePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      setVolume(videoRef.current.muted ? 0 : videoRef.current.volume);
    }
  };

  const changeVolume = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const skipBackward = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime -= seconds;
    }
  };

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!videoRef.current?.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!videoRef.current) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skipBackward(10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipForward(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeVolume(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeVolume(Math.max(0, volume - 0.1));
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyP':
        e.preventDefault();
        togglePictureInPicture();
        break;
      default:
        break;
    }
  }, [volume]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleMouseLeave = () => {
    if (!videoRef.current?.paused) {
      setShowControls(false);
    }
  };

  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
    return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player bg-black">
      {loading && (
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading torrent...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64 text-red-500">
          <div className="text-center">
            <p className="text-xl mb-2">⚠️</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div
        className="relative group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={resetControlsTimeout}
          onPause={() => setShowControls(true)}
          className="w-full max-h-screen bg-black"
          style={{ display: loading ? 'none' : 'block' }}
          playsInline
        />

        {/* Custom Controls Overlay */}
        {!loading && !error && (
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
              <div className="text-white text-sm font-medium truncate max-w-md">
                {file?.name}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={togglePictureInPicture}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded transition-colors"
                  title="Picture-in-Picture"
                  aria-label="Toggle picture-in-picture mode"
                >
                  📺
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? '⛶' : '⛶'}
                </button>
              </div>
            </div>

            {/* Center Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => {
                  if (videoRef.current?.paused) {
                    videoRef.current.play();
                  } else {
                    videoRef.current?.pause();
                  }
                }}
                className="bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all duration-200 transform hover:scale-110"
                aria-label={videoRef.current?.paused ? 'Play' : 'Pause'}
              >
                {videoRef.current?.paused ? '▶️' : '⏸️'}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="relative bg-gray-600 h-1 rounded cursor-pointer" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  seekTo(percent * duration);
                }}>
                  <div
                    className="bg-blue-500 h-full rounded transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Skip Backward */}
                  <button
                    onClick={() => skipBackward(10)}
                    className="text-white hover:text-blue-400 transition-colors"
                    aria-label="Skip backward 10 seconds"
                  >
                    ⏪
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={() => {
                      if (videoRef.current?.paused) {
                        videoRef.current.play();
                      } else {
                        videoRef.current?.pause();
                      }
                    }}
                    className="text-white hover:text-blue-400 text-xl transition-colors"
                    aria-label={videoRef.current?.paused ? 'Play' : 'Pause'}
                  >
                    {videoRef.current?.paused ? '▶️' : '⏸️'}
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={() => skipForward(10)}
                    className="text-white hover:text-blue-400 transition-colors"
                    aria-label="Skip forward 10 seconds"
                  >
                    ⏩
                  </button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-blue-400 transition-colors"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => changeVolume(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      aria-label="Volume"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Playback Speed */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
                    className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    aria-label="Playback speed"
                  >
                    <option value="0.25">0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>

                  {/* Torrent Info */}
                  <div className="text-white text-xs space-y-1">
                    <div>Progress: {progress.toFixed(1)}%</div>
                    <div>↓ {formatSpeed(downloadSpeed)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Info */}
      {!loading && !error && (
        <div className="mt-4 text-gray-400 text-xs text-center">
          <p>Keyboard shortcuts: Space (play/pause), ←→ (seek), ↑↓ (volume), F (fullscreen), M (mute), P (PiP)</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;