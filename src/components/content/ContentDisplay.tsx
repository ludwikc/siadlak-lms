
import React from 'react';
import MediaPlayer from '@/components/media/MediaPlayer';
import MarkdownRenderer from '@/components/content/MarkdownRenderer';
import { cn } from '@/lib/utils';

interface ContentDisplayProps {
  title?: string;
  mediaUrl?: string;
  mediaType?: 'video' | 'audio' | 'text';
  content: string;
  transcript?: string;
  className?: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({
  title,
  mediaUrl,
  mediaType = 'text',
  content,
  transcript,
  className,
}) => {
  return (
    <div className={cn("flex flex-col space-y-6", className)}>
      {/* Title */}
      {title && (
        <h1 className="text-2xl font-bold text-discord-header-text">{title}</h1>
      )}
      
      {/* Media Content (Video/Audio) */}
      {mediaType !== 'text' && mediaUrl && (
        <div className="mb-2">
          <MediaPlayer 
            url={mediaUrl} 
            title={title}
            aspectRatio={mediaType === 'video' ? 16/9 : undefined}
          />
        </div>
      )}
      
      {/* Main Content */}
      <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6">
        <MarkdownRenderer content={content} />
      </div>
      
      {/* Transcript (if available) */}
      {transcript && (
        <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-6">
          <h3 className="mb-4 text-lg font-semibold text-discord-header-text">Transcript</h3>
          <div className="max-h-96 overflow-y-auto text-discord-secondary-text">
            <MarkdownRenderer content={transcript} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;
