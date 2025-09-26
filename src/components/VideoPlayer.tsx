import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabase';

// Extend window interface for WebTorrent
declare global {
  interface Window {
    WebTorrent: any;
  }
}

// IndexedDB helper for storing downloaded torrents
class TorrentStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WatchifyTorrents', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('torrents')) {
          db.createObjectStore('torrents', { keyPath: 'magnetHash' });
        }
      };
    });
  }

  async storeTorrent(magnetHash: string, blob: Blob, metadata: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['torrents'], 'readwrite');
      const store = transaction.objectStore('torrents');

      const torrentData = {
        magnetHash,
        blob,
        metadata,
        downloadedAt: new Date().toISOString(),
        size: blob.size
      };

      const request = store.put(torrentData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTorrent(magnetHash: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['torrents'], 'readonly');
      const store = transaction.objectStore('torrents');
      const request = store.get(magnetHash);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async listStoredTorrents(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['torrents'], 'readonly');
      const store = transaction.objectStore('torrents');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

const torrentStorage = new TorrentStorage();

const VideoPlayer = ({ magnet, magnetHash, resumeTime }) => {
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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSpeedState, setDownloadSpeedState] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [downloadedSize, setDownloadedSize] = useState(0);
  const controlsTimeoutRef = useRef(null);
  const [isVideoElementReady, setIsVideoElementReady] = useState(false);

  // Validate magnet URL
  useEffect(() => {
    if (!magnet) {
      setError('No magnet link provided');
      setLoading(false);
      return;
    }

    if (!magnet.startsWith('magnet:?')) {
      setError(`Invalid magnet link format. Link: ${magnet.substring(0, 50)}...`);
      setLoading(false);
      return;
    }

    console.log('VideoPlayer: Valid magnet URL detected');
  }, [magnet]);

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

  // Effect to trigger torrent streaming when video element becomes available
  useEffect(() => {
    if (!magnet || magnet.startsWith('youtube:') || !isVideoElementReady || loading) {
      return;
    }

    const initializeTorrentStreaming = async () => {
      console.log('VideoPlayer: Video element ready, starting torrent streaming initialization');

      // First check if we already have this torrent stored locally
      try {
        const storedTorrent = await torrentStorage.getTorrent(magnetHash);
        if (storedTorrent && videoRef.current) {
          console.log('VideoPlayer: Found stored torrent, playing from local storage');
          const url = URL.createObjectURL(storedTorrent.blob);
          videoRef.current.src = url;
          setLoading(false);

          // Resume from saved position
          if (resumeTime > 0) {
            videoRef.current.currentTime = resumeTime;
          }
          return;
        }
      } catch (err) {
        console.warn('VideoPlayer: Error checking stored torrent:', err);
      }

      // Start client-side torrenting
      startClientSideTorrenting();
    };

    const startClientSideTorrenting = async () => {
      try {
        if (!videoRef.current) {
          console.log('VideoPlayer: Video element not available during torrent setup');
          return;
        }

        setLoading(true);
        setError(null);
        console.log('VideoPlayer: Starting client-side torrenting...');

        // Initialize WebTorrent client
        if (!client) {
          const WebTorrent = (window as any).WebTorrent;
          if (!WebTorrent) {
            throw new Error('WebTorrent not available. Please refresh the page.');
          }

          const newClient = new WebTorrent();
          setClient(newClient);

          // Set up client event listeners
          newClient.on('error', (err) => {
            console.error('WebTorrent client error:', err);
            setError('Torrent client error: ' + err.message);
            setLoading(false);
          });

          newClient.on('warning', (err) => {
            console.warn('WebTorrent client warning:', err);
          });
        }

        const activeClient = client || (window as any).WebTorrent ? new (window as any).WebTorrent() : null;
        if (!activeClient) {
          throw new Error('Failed to initialize WebTorrent client');
        }

        console.log('VideoPlayer: Adding torrent:', magnet.substring(0, 50) + '...');

        // Add torrent with additional trackers for better peer discovery
        const torrentOptions = {
          announce: [
            'wss://tracker.btorrent.xyz',
            'wss://tracker.openwebtorrent.com',
            'udp://tracker.coppersurfer.tk:6969/announce',
            'udp://9.rarbg.to:2920/announce',
            'udp://tracker.opentrackr.org:1337',
            'udp://tracker.internetwarriors.net:1337/announce',
            'udp://tracker.leechers-paradise.org:6969/announce',
            'udp://tracker.pirateparty.gr:6969/announce',
            'udp://tracker.cyberia.is:6969/announce'
          ]
        };

        activeClient.add(magnet, torrentOptions, (torrent) => {
          console.log('VideoPlayer: Torrent added:', torrent.infoHash);
          setTorrent(torrent);

          // Update progress
          const updateProgress = () => {
            const progress = (torrent.downloaded / torrent.length) * 100;
            setDownloadProgress(progress);
            setDownloadSpeed(torrent.downloadSpeed);
            setUploadSpeed(torrent.uploadSpeed);
            setTotalSize(torrent.length);
            setDownloadedSize(torrent.downloaded);
          };

          // Set up torrent event listeners
          torrent.on('download', updateProgress);
          torrent.on('upload', updateProgress);

          torrent.on('done', () => {
            console.log('VideoPlayer: Torrent download complete');
            setIsDownloading(false);
          });

          torrent.on('error', (err) => {
            console.error('VideoPlayer: Torrent error:', err);
            setError('Torrent error: ' + err.message);
            setLoading(false);
          });

          // Find the largest video file
          const videoFiles = torrent.files.filter(file =>
            file.name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
          );

          if (videoFiles.length === 0) {
            setError('No video files found in this torrent. The torrent may not contain video content.');
            setLoading(false);
            return;
          }

          // Sort by size and get the largest
          videoFiles.sort((a, b) => b.length - a.length);
          const videoFile = videoFiles[0];

          console.log('VideoPlayer: Streaming file:', videoFile.name, 'Size:', videoFile.length);
          setFile(videoFile);

          // Use WebTorrent's built-in streaming method
          // This is the CORRECT way to stream torrents - it handles buffering automatically
          videoFile.appendTo(videoRef.current, {
            autoplay: false,
            controls: false
          }, (err, elem) => {
            if (err) {
              console.error('VideoPlayer: Append to video failed:', err);
              setError('Failed to stream video: ' + err.message);
              setLoading(false);
              return;
            }

            console.log('VideoPlayer: Video streaming started successfully');

            // Set up video event listeners
            const handleCanPlay = () => {
              console.log('VideoPlayer: Video can play, starting playback');
              setLoading(false);
              if (resumeTime > 0) {
                videoRef.current.currentTime = resumeTime;
              }
            };

            const handleVideoError = (e) => {
              console.error('VideoPlayer: Video playback error:', e);
              setError('Video playback failed. The torrent file may be corrupted or incompatible.');
              setLoading(false);
            };

            const handleLoadStart = () => {
              console.log('VideoPlayer: Video load started');
              setLoading(true);
            };

            const handleProgress = () => {
              // Update buffering progress from video element
              if (videoRef.current && videoRef.current.buffered.length > 0) {
                const buffered = videoRef.current.buffered.end(0);
                const duration = videoRef.current.duration;
                if (duration > 0) {
                  setDownloadProgress((buffered / duration) * 100);
                }
              }
            };

            videoRef.current.addEventListener('canplay', handleCanPlay);
            videoRef.current.addEventListener('error', handleVideoError);
            videoRef.current.addEventListener('loadstart', handleLoadStart);
            videoRef.current.addEventListener('progress', handleProgress);

            // Clean up event listeners on unmount
            return () => {
              if (videoRef.current) {
                videoRef.current.removeEventListener('canplay', handleCanPlay);
                videoRef.current.removeEventListener('error', handleVideoError);
                videoRef.current.removeEventListener('loadstart', handleLoadStart);
                videoRef.current.removeEventListener('progress', handleProgress);
              }
            };
          });

        });

      } catch (err) {
        console.error('VideoPlayer: Client-side torrenting failed:', err);
        setError(`Torrent streaming failed: ${err.message}.

Client-side torrenting requires:
• WebTorrent support in your browser
• Active torrent with available peers
• Network connectivity to torrent trackers

If torrenting fails, try using YouTube search instead.`);
        setLoading(false);
      }
    };

    initializeTorrentStreaming();
  }, [magnet, magnetHash, resumeTime, isVideoElementReady]);

  // Effect to set video element ready state
  useEffect(() => {
    if (videoRef.current && magnet && !magnet.startsWith('youtube:') && !error) {
      setIsVideoElementReady(true);
    } else {
      setIsVideoElementReady(false);
    }
  }, [magnet, error]);  const saveProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && videoRef.current && magnet) {
      await supabase
        .from('user_history')
        .upsert({
          user_id: user.id,
          torrent_id: magnetHash,
          magnet_url: magnet,
          title: 'Streaming Video', // Since we don't have file info from server streaming
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
    <div className="video-player bg-black min-h-screen">
      {loading && (
        <div className="flex items-center justify-center min-h-64 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg mb-2">Connecting to stream...</p>
            <p className="text-sm text-gray-300">Setting up video stream from server</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center min-h-64 text-white p-6">
          <div className="text-center max-w-md">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Streaming Unavailable</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="bg-slate-800 p-4 rounded-lg text-left">
              <p className="text-sm text-slate-300 mb-2">Alternative options:</p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Use an external torrent client</li>
                <li>• Check if the torrent has active peers</li>
                <li>• Try again later</li>
              </ul>
            </div>
            {magnet && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Magnet Link:</p>
                <div className="bg-slate-800 p-2 rounded text-xs font-mono break-all text-slate-300">
                  {magnet}
                </div>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(magnet)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={() => window.open(magnet, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    🌐 Open Externally
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {magnet && !error && (
        <div className="relative bg-black group" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          {magnet.startsWith('youtube:') ? (
            // YouTube iframe player
            <iframe
              src={`https://www.youtube.com/embed/${magnet.replace('youtube:', '')}?autoplay=1&rel=0`}
              className="w-full h-96 md:h-[600px]"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
          ) : (
            <>
            {/* Regular video element for torrents */}
            <video
              ref={videoRef}
              className="w-full h-auto"
              controls={!showControls}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={resetControlsTimeout}
              onPause={() => setShowControls(true)}
              onError={(e) => {
                console.error('Video element error:', e);
                setError('Video playback failed. The stream may be unavailable.');
              }}
              preload="metadata"
              playsInline
            />

            {/* Custom Controls Overlay - only for torrent videos */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center space-x-4 text-white">
                <button
                  onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
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
          </>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Info */}
      {!loading && !error && (
        <div className="mt-4 text-center text-slate-400 text-xs">
          <p>Keyboard shortcuts: Space (play/pause), ←→ (seek ±10s), ↑↓ (volume), F (fullscreen), M (mute), P (PiP)</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;