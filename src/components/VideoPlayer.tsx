import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { StreamingService, StreamStatus } from '../services/torrent';
import { logger } from '../utils/logger';

interface VideoPlayerProps {
  magnet?: string;
  magnetHash?: string;
  resumeTime?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ magnet, magnetHash, resumeTime = 0 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamingServiceRef = useRef<StreamingService | null>(null);

  // UI State
  const [status, setStatus] = useState<StreamStatus>({ state: 'idle', progress: 0, downloadSpeed: 0, peers: 0, bufferHealth: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize streaming service
  useEffect(() => {
    streamingServiceRef.current = new StreamingService();
    logger.info('VideoPlayer', 'Streaming service initialized');

    return () => {
      if (streamingServiceRef.current) {
        streamingServiceRef.current.destroy();
        logger.info('VideoPlayer', 'Streaming service destroyed');
      }
    };
  }, []);

  // Start streaming when magnet is available
  useEffect(() => {
    if (!magnet || !videoRef.current || !streamingServiceRef.current) return;

    const startStreaming = async () => {
      try {
        setError(null);
        logger.info('VideoPlayer', 'Starting magnet stream', { magnet: magnet.substring(0, 50) + '...' });

        await streamingServiceRef.current!.streamMagnet(magnet, videoRef.current!, {
          autoplay: true,
          onStatusChange: (newStatus) => {
            setStatus(newStatus);
            if (newStatus.error) {
              setError(newStatus.error);
            }
          }
        });

        // Resume from saved position
        if (resumeTime > 0) {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = resumeTime;
            }
          }, 1000);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
        setError(errorMessage);
        logger.error('VideoPlayer', 'Failed to start streaming', err);
      }
    };

    startStreaming();
  }, [magnet, resumeTime]);

  // Video element event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  // Control functions
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      logger.warn('VideoPlayer', 'PiP failed', err);
    }
  }, []);

  const changePlaybackSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      setVolume(videoRef.current.muted ? 0 : videoRef.current.volume);
    }
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipForward = useCallback((seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  }, []);

  const skipBackward = useCallback((seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime -= seconds;
    }
  }, []);

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [volume, skipBackward, skipForward, changeVolume, toggleFullscreen, toggleMute, togglePictureInPicture]);

  // Keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Progress saving
  const saveProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && videoRef.current && magnet) {
      await supabase
        .from('user_history')
        .upsert({
          user_id: user.id,
          torrent_id: magnetHash,
          magnet_url: magnet,
          title: 'Streaming Video',
          progress_seconds: videoRef.current.currentTime,
          last_watched_at: new Date().toISOString()
        });
    }
  }, [magnet, magnetHash]);

  useEffect(() => {
    if (!magnet) return;

    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [magnet, saveProgress]);

  // Utility functions
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
    return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const formatTime = (time: number): string => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => resetControlsTimeout();
  const handleMouseLeave = () => {
    if (!videoRef.current?.paused) {
      setShowControls(false);
    }
  };

  // Loading state
  if (status.state === 'idle' || status.state === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-64 text-white bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg mb-2">Connecting to stream...</p>
          <p className="text-sm text-gray-300">Setting up video stream</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-white p-6 bg-black">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Streaming Unavailable</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          {magnet && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Magnet Link:</p>
              <div className="bg-slate-800 p-2 rounded text-xs font-mono break-all text-slate-300">
                {magnet}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // YouTube fallback
  if (magnet?.startsWith('youtube:')) {
    return (
      <div className="relative bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${magnet.replace('youtube:', '')}?autoplay=1&rel=0`}
          className="w-full h-96 md:h-[600px]"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
    );
  }

  // Main video player
  return (
    <div className="video-player bg-black min-h-screen">
      <div className="relative bg-black group" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <video
          ref={videoRef}
          className="w-full h-auto"
          controls={!showControls}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={resetControlsTimeout}
          onPause={() => setShowControls(true)}
          onError={(e) => {
            logger.error('VideoPlayer', 'Video element error', e);
            setError('Video playback failed. The stream may be unavailable.');
          }}
          preload="metadata"
          playsInline
        />

        {/* Status overlay */}
        {(status.state === 'buffering' || status.state === 'playing') && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded text-xs ${
                status.state === 'buffering' ? 'bg-yellow-600' : 'bg-green-600'
              }`}>
                {status.state === 'buffering' ? 'Buffering' : 'Playing'}
              </span>
              {status.downloadSpeed > 0 && (
                <span>↓ {formatSpeed(status.downloadSpeed)}</span>
              )}
              {status.peers > 0 && (
                <span>{status.peers} peers</span>
              )}
              <span>Buffer: {status.bufferHealth.toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center space-x-4 text-white">
              <button
                onClick={() => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause()}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                aria-label={videoRef.current?.paused ? 'Play' : 'Pause'}
              >
                {videoRef.current?.paused ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                )}
              </button>

              <div className="flex-1 flex items-center space-x-2">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="flex-1 h-1 bg-white/30 rounded appearance-none cursor-pointer"
                  aria-label="Seek video"
                />
                <span className="text-sm">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded appearance-none cursor-pointer"
                  aria-label="Volume control"
                />
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => changePlaybackSpeed(playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1)}
                  className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                >
                  {playbackSpeed}x
                </button>
                <button
                  onClick={togglePictureInPicture}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  aria-label="Picture in Picture"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  aria-label="Fullscreen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m0 0l-5-5m11 5l5-5m0 0v4m0-4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 text-center text-slate-400 text-xs">
        <p>Keyboard shortcuts: Space (play/pause), ←→ (seek ±10s), ↑↓ (volume), F (fullscreen), M (mute), P (PiP)</p>
      </div>
    </div>
  );
};

export default VideoPlayer;