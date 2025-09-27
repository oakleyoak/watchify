import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  streamUrl: string;
  resumeTime: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, resumeTime }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && resumeTime > 0) {
      videoRef.current.currentTime = resumeTime;
    }
  }, [resumeTime]);

  return (
    <video
      ref={videoRef}
      src={streamUrl}
      controls
      autoPlay
      style={{ width: '100%', maxHeight: '70vh', background: '#000' }}
    />
  );
};

export default VideoPlayer;