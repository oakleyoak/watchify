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

  useEffect(() => {
    let wtClient;

    const initWebTorrent = async () => {
      try {
        console.log('VideoPlayer: Checking if WebTorrent is already loaded...');
        if (typeof window !== 'undefined' && window.WebTorrent) {
          console.log('VideoPlayer: WebTorrent already available');
          wtClient = new window.WebTorrent({
            maxConns: 55, // Reduce connection limit for browser compatibility
            webSeeds: true // Enable web seeds support
          });
          setClient(wtClient);
          return;
        }

        console.log('VideoPlayer: WebTorrent not found, loading from CDN...');

        // Try multiple CDNs in sequence
        const cdns = [
          'https://unpkg.com/webtorrent@2.1.4/webtorrent.min.js',
          'https://cdn.jsdelivr.net/npm/webtorrent@2.1.4/webtorrent.min.js',
          'https://cdn.jsdelivr.net/npm/webtorrent@2.0.0/webtorrent.min.js'
        ];

        let loaded = false;
        for (const cdnUrl of cdns) {
          if (loaded) break;

          try {
            console.log(`VideoPlayer: Trying CDN: ${cdnUrl}`);
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = cdnUrl;
              script.onload = () => {
                console.log(`VideoPlayer: Successfully loaded WebTorrent from ${cdnUrl}`);
                loaded = true;
                resolve(undefined);
              };
              script.onerror = (err) => {
                console.warn(`VideoPlayer: Failed to load from ${cdnUrl}:`, err);
                reject(err);
              };
              document.head.appendChild(script);
            });
          } catch (err) {
            console.warn(`VideoPlayer: CDN ${cdnUrl} failed, trying next...`);
            continue;
          }
        }

        if (!loaded || !window.WebTorrent) {
          throw new Error('All CDN sources failed to load WebTorrent. This is common due to browser security restrictions.');
        }

        console.log('VideoPlayer: Creating WebTorrent client...');
        wtClient = new window.WebTorrent({
          maxConns: 55, // Reduce connection limit for browser compatibility
          webSeeds: true // Enable web seeds support
        });

        wtClient.on('error', (err) => {
          console.error('VideoPlayer: WebTorrent client error:', err);
          setError(`WebTorrent client error: ${err.message}. WebTorrent has limitations in browsers. Try using an external torrent client instead.`);
          setLoading(false);
        });

        wtClient.on('warning', (err) => {
          console.warn('VideoPlayer: WebTorrent warning:', err);
        });

        console.log('VideoPlayer: WebTorrent client created successfully');
        setClient(wtClient);

      } catch (err) {
        console.error('VideoPlayer: Failed to initialize WebTorrent:', err);
        setError(`Failed to load WebTorrent: ${err.message}. 

WebTorrent in browsers has significant limitations:
• Requires active peers/seeders for the torrent
• Browser security policies may block WebRTC connections
• Some browsers disable torrenting entirely
• Large files may exceed browser storage limits

For reliable torrent playback, please use an external torrent client with the magnet link below.`);
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
        console.log('VideoPlayer: Destroying WebTorrent client');
        wtClient.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!client || !magnet) {
      console.log('VideoPlayer: Missing client or magnet', { client: !!client, magnet: !!magnet });
      return;
    }

    console.log('VideoPlayer: Starting torrent with magnet:', magnet.substring(0, 50) + '...');

    // First check if we already have this torrent stored locally
    const checkStoredTorrent = async () => {
      try {
        const storedTorrent = await torrentStorage.getTorrent(magnetHash);
        if (storedTorrent) {
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

      // If not stored locally, proceed with download
      startTorrentDownload();
    };

    const startTorrentDownload = () => {
      console.log('VideoPlayer: Starting torrent download with magnet:', magnet.substring(0, 50) + '...');

      setLoading(true);
      setError(null);
      setIsDownloading(true);
      setDownloadProgress(0);

      try {
        client.add(magnet, { destroyOnDone: false }, (torrent) => {
          console.log('VideoPlayer: Torrent added successfully:', torrent.name);
          setTorrent(torrent);
          setTotalSize(torrent.length);

          // Find the largest video file
          const videoFiles = torrent.files.filter(file =>
            file.name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)
          );

          console.log('VideoPlayer: Found video files:', videoFiles.length);

          if (videoFiles.length === 0) {
            setError('No video files found in torrent. Try using an external torrent client with this magnet link: ' + magnet);
            setLoading(false);
            setIsDownloading(false);
            return;
          }

          const videoFile = videoFiles.reduce((largest, current) =>
            current.length > largest.length ? current : largest
          );

          console.log('VideoPlayer: Selected video file:', videoFile.name, 'Size:', videoFile.length);
          setFile(videoFile);

          // Update download progress
          const updateProgress = () => {
            const progress = torrent.progress * 100;
            const downloaded = torrent.downloaded;
            const speed = torrent.downloadSpeed;

            setDownloadProgress(progress);
            setDownloadedSize(downloaded);
            setDownloadSpeedState(speed);

            console.log(`VideoPlayer: Download progress: ${progress.toFixed(1)}%, Speed: ${(speed / 1024 / 1024).toFixed(2)} MB/s`);

            if (progress >= 100) {
              console.log('VideoPlayer: Download complete, creating video URL');
              setIsDownloading(false);

              // Create object URL for video
              videoFile.getBlobURL((err, url) => {
                if (err) {
                  console.error('VideoPlayer: Failed to get blob URL:', err);
                  setError('Failed to load video file. Try using an external torrent client with this magnet link: ' + magnet);
                  setLoading(false);
                  return;
                }

                console.log('VideoPlayer: Got blob URL, setting video src');
                videoRef.current.src = url;
                setLoading(false);

                // Resume from saved position
                if (resumeTime > 0) {
                  videoRef.current.currentTime = resumeTime;
                }
              });
            }
          };

          // Set up progress monitoring
          const progressInterval = setInterval(updateProgress, 1000);
          updateProgress(); // Initial update

          torrent.on('done', () => {
            console.log('VideoPlayer: Torrent download completed');

            // Store the downloaded torrent for offline playback
            videoFile.getBlob((err, blob) => {
              if (!err && blob) {
                const metadata = {
                  name: videoFile.name,
                  size: videoFile.length,
                  torrentName: torrent.name,
                  downloadedAt: new Date().toISOString()
                };

                torrentStorage.storeTorrent(magnetHash, blob, metadata)
                  .then(() => console.log('VideoPlayer: Torrent stored for offline playback'))
                  .catch(err => console.warn('VideoPlayer: Failed to store torrent:', err));
              }
            });

            clearInterval(progressInterval);
            updateProgress();
          });

          torrent.on('error', (err) => {
            console.error('VideoPlayer: Torrent error:', err);
            clearInterval(progressInterval);
            setError('Torrent download failed. Try using an external torrent client with this magnet link: ' + magnet);
            setLoading(false);
            setIsDownloading(false);
          });
        });

        client.on('error', (err) => {
          console.error('VideoPlayer: Client error:', err);
          setError('Torrent client error. Try using an external torrent client with this magnet link: ' + magnet);
          setLoading(false);
          setIsDownloading(false);
        });
      } catch (error) {
        console.error('VideoPlayer: Failed to add torrent:', error);
        setError('Failed to initialize torrent download. Try using an external torrent client with this magnet link: ' + magnet);
        setLoading(false);
        setIsDownloading(false);
      }
    };

    checkStoredTorrent();

    return () => {
      if (torrent) {
        torrent.destroy();
        setTorrent(null);
      }
    };
  }, [client, magnet, magnetHash, resumeTime]);

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && videoRef.current && file) {
      // Hash the magnet URL for database storage
      const hashMagnet = (magnet: string): string => {
        let hash = 0;
        for (let i = 0; i < magnet.length; i++) {
          const char = magnet.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
      };

      await supabase
        .from('user_history')
        .upsert({
          user_id: user.id,
          torrent_id: hashMagnet(magnet),
          magnet_url: magnet,
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
      {loading && isDownloading && (
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg mb-2">Downloading torrent...</p>
            <div className="w-64 bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-300">
              {downloadProgress.toFixed(1)}% complete
              {downloadSpeedState > 0 && (
                <span className="ml-2">
                  ({(downloadSpeedState / 1024 / 1024).toFixed(2)} MB/s)
                </span>
              )}
            </p>
            {totalSize > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {(downloadedSize / 1024 / 1024 / 1024).toFixed(2)} GB of {(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
            )}
          </div>
        </div>
      )}

      {loading && !isDownloading && (
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Preparing video...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center min-h-64 text-white p-6">
          <div className="text-center max-w-md">
            <p className="text-xl mb-4">⚠️</p>
            <p className="mb-4">{error}</p>
            <div className="bg-gray-800 p-4 rounded mb-4">
              <p className="text-sm text-gray-300 mb-2">Magnet Link:</p>
              <p className="text-xs text-blue-400 break-all font-mono">{magnet}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigator.clipboard.writeText(magnet)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2"
              >
                Copy Magnet Link
              </button>
              <button
                onClick={() => window.open(`magnet:?${magnet.split('magnet:?')[1]}`, '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Open in Torrent Client
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Use an external torrent client like qBittorrent, uTorrent, or Transmission to download and play this video.
            </p>
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