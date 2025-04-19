
import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { extractMediaType, generateEmbedCode } from '@/lib/media-utils';

interface MediaPlayerProps {
  url: string;
  title?: string;
  aspectRatio?: number;
  className?: string;
  allowAutoplay?: boolean;
  showControls?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  url,
  title = 'Media content',
  aspectRatio = 16 / 9,
  className,
  allowAutoplay = false,
  showControls = true,
}) => {
  const mediaType = extractMediaType(url);
  
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-discord-sidebar-bg bg-discord-deep-bg text-discord-secondary-text">
        No media URL provided
      </div>
    );
  }

  // Handle video and audio separately
  if (mediaType === 'video' || mediaType === 'audio') {
    const embedCode = generateEmbedCode(url, {
      autoplay: allowAutoplay,
      controls: showControls,
      title,
    });

    // Audio doesn't need aspect ratio container
    if (mediaType === 'audio') {
      return (
        <div className={cn("w-full rounded-md overflow-hidden border border-discord-sidebar-bg", className)}>
          <div dangerouslySetInnerHTML={{ __html: embedCode }} />
        </div>
      );
    }

    // Video with aspect ratio
    return (
      <div className={cn("w-full rounded-md overflow-hidden border border-discord-sidebar-bg", className)}>
        <AspectRatio ratio={aspectRatio}>
          <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: embedCode }} />
        </AspectRatio>
      </div>
    );
  }

  // Fallback for unsupported media types
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-discord-sidebar-bg bg-discord-deep-bg text-discord-secondary-text">
      Unsupported media type
    </div>
  );
};

export default MediaPlayer;
