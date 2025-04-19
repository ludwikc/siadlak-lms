
import React, { useEffect, useRef } from 'react';
import ContentDisplay from '@/components/content/ContentDisplay';

interface EnhancedContentDisplayProps {
  title: string;
  mediaUrl?: string;
  mediaType?: 'video' | 'audio' | 'text';
  content: string;
  transcript?: string;
  playbackSpeed?: number;
  initialPosition?: number;
  onProgress?: (position: number, duration: number) => void;
}

// This component extends ContentDisplay with progress tracking
const EnhancedContentDisplay: React.FC<EnhancedContentDisplayProps> = ({
  title,
  mediaUrl,
  mediaType,
  content,
  transcript,
  playbackSpeed = 1.0,
  initialPosition = 0,
  onProgress
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);
  
  // Set up media event listeners
  useEffect(() => {
    if (mediaType !== 'video' && mediaType !== 'audio') return;
    
    // Get the media element
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (!mediaElement) return;
    
    if (mediaType === 'video') {
      videoRef.current = mediaElement as HTMLVideoElement;
    } else {
      audioRef.current = mediaElement as HTMLAudioElement;
    }
    
    // Set playback rate
    mediaElement.playbackRate = playbackSpeed;
    
    // Set initial position if provided
    if (initialPosition > 0 && initialPosition <= 1) {
      const targetTime = mediaElement.duration * initialPosition;
      if (!isNaN(targetTime)) {
        mediaElement.currentTime = targetTime;
      }
    }
    
    // Track progress
    const trackProgress = () => {
      if (onProgress && mediaElement.duration) {
        onProgress(mediaElement.currentTime, mediaElement.duration);
      }
    };
    
    // Set up progress tracking interval
    progressInterval.current = window.setInterval(trackProgress, 5000);
    
    // Clean up
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [mediaType, playbackSpeed, initialPosition, onProgress]);
  
  // Update playback speed when preference changes
  useEffect(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement) {
      mediaElement.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  return (
    <ContentDisplay
      title={title}
      mediaUrl={mediaUrl}
      mediaType={mediaType}
      content={content}
      transcript={transcript}
    />
  );
};

export default EnhancedContentDisplay;
