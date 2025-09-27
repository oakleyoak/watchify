import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const magnet = searchParams.get('magnet');
  // const title = searchParams.get('title');
  const [resumeTime, setResumeTime] = useState(0);
  // Only show fallback to VLC if streaming fails
  const [showVLCFallback, setShowVLCFallback] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const decodedMagnet = magnet ? decodeURIComponent(magnet) : '';
  const magnetHash = decodedMagnet ? hashMagnet(decodedMagnet) : '';
  const hasValidMagnet = decodedMagnet && decodedMagnet.startsWith('magnet:?') && decodedMagnet.includes('xt=urn:btih:');

  // Validate magnet link format
  const validateMagnetLink = (magnetLink: string): { isValid: boolean; error?: string } => {
    if (!magnetLink) {
      return { isValid: false, error: 'No magnet link provided' };
    }

    if (!magnetLink.startsWith('magnet:?')) {
      return { isValid: false, error: 'Invalid magnet link format - must start with "magnet:?"' };
    }

    if (!magnetLink.includes('xt=urn:btih:')) {
      return { isValid: false, error: 'Invalid magnet link - missing torrent hash (xt=urn:btih:)' };
    }

    // Check for basic structure
    const url = new URL(magnetLink);
    if (!url.searchParams.has('xt')) {
      return { isValid: false, error: 'Invalid magnet link - missing xt parameter' };
    }

    return { isValid: true };
  };

  const magnetValidation = validateMagnetLink(decodedMagnet);

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

  const handleOpenInVLC = async () => {
    if (!magnetValidation.isValid) {
      setShowVLCFallback(true);
      return;
    }
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.openInVLC(decodedMagnet);
        if (!result.success) setShowVLCFallback(true);
      } catch {
        setShowVLCFallback(true);
      }
    } else {
      try {
        window.open(decodedMagnet, '_blank');
      } catch {
        setShowVLCFallback(true);
      }
    }
  };

  const handleSetVLCAsDefault = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.setVLCAsDefault();
      if (result.success) {
        alert('VLC has been set as the default magnet link handler!');
      } else {
        alert('Failed to set VLC as default: ' + (result.error || 'Unknown error'));
      }
    }
  };

  const handleStartWebTorrentStream = async () => {
    setShowVLCFallback(false);
    if (!magnetValidation.isValid) {
      setShowVLCFallback(true);
      return;
    }
    if (!window.electronAPI) {
      setShowVLCFallback(true);
      return;
    }
    setIsStreaming(true);
    setStreamUrl(null);
    try {
      const result = await window.electronAPI.startWebTorrentStream(decodedMagnet);
      if (result.success && result.streamUrl) {
        setStreamUrl(result.streamUrl);
      } else {
        setStreamUrl(null);
        setShowVLCFallback(true);
      }
    } catch {
      setStreamUrl(null);
      setShowVLCFallback(true);
    } finally {
      setIsStreaming(false);
    }
  };

  // const handleCopyMagnet = async () => {
  //   if (window.electronAPI) {
  //     // Desktop app: use Electron clipboard
  //     await window.electronAPI.copyToClipboard(decodedMagnet);
  //     alert('Magnet link copied to clipboard!');
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Player</h1>
      {typeof streamUrl === 'string' && streamUrl && (
        <VideoPlayer streamUrl={streamUrl} resumeTime={resumeTime} />
      )}
      {!streamUrl && !showVLCFallback && (
        <div className="flex flex-col items-center justify-center h-64">
          <button
            onClick={handleStartWebTorrentStream}
            disabled={isStreaming}
            className={`px-6 py-3 rounded text-lg font-semibold ${isStreaming ? 'bg-gray-500 text-white cursor-wait' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
          >
            {isStreaming ? 'Starting Stream...' : 'Start Streaming'}
          </button>
        </div>
      )}
      {!streamUrl && showVLCFallback && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="mb-4 text-red-600 font-semibold">Streaming failed or not supported. Try opening in VLC or another torrent client.</div>
          <button
            onClick={handleOpenInVLC}
            className="px-6 py-3 rounded text-lg font-semibold bg-green-600 text-white hover:bg-green-700"
          >
            Open Magnet in VLC
          </button>
        </div>
      )}
    </div>
  );
        return (
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Video Player</h1>
            {streamUrl && (
              <VideoPlayer streamUrl={streamUrl} resumeTime={resumeTime} />
            )}
            {!streamUrl && !showVLCFallback && (
              <div className="flex flex-col items-center justify-center h-64">
                <button
                  onClick={handleStartWebTorrentStream}
                  disabled={isStreaming}
                  className={`px-6 py-3 rounded text-lg font-semibold ${isStreaming ? 'bg-gray-500 text-white cursor-wait' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                  {isStreaming ? 'Starting Stream...' : 'Start Streaming'}
                </button>
              </div>
            )}
            {!streamUrl && showVLCFallback && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="mb-4 text-red-600 font-semibold">Streaming failed or not supported. Try opening in VLC or another torrent client.</div>
                <button
                  onClick={handleOpenInVLC}
                  className="px-6 py-3 rounded text-lg font-semibold bg-green-600 text-white hover:bg-green-700"
                >
                  Open Magnet in VLC
                </button>
              </div>
            )}
          </div>
        );