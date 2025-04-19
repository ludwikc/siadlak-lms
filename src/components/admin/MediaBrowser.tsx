
import React, { useState, useEffect } from 'react';
import MediaPlayer from '@/components/media/MediaPlayer';
import { isValidMediaUrl, extractMediaType } from '@/lib/media-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image, FileVideo, FileAudio, AlertCircle } from 'lucide-react';

interface MediaBrowserProps {
  onSelectMedia: (url: string) => void;
  defaultValue?: string;
  allowedTypes?: ('video' | 'audio' | 'image')[];
}

const MediaBrowser: React.FC<MediaBrowserProps> = ({
  onSelectMedia,
  defaultValue = '',
  allowedTypes = ['video', 'audio', 'image'],
}) => {
  const [mediaUrl, setMediaUrl] = useState(defaultValue);
  const [isValid, setIsValid] = useState(true);
  const [recentMedia, setRecentMedia] = useState<string[]>([]);
  
  // Load recent media from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentMedia');
      if (saved) {
        setRecentMedia(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading recent media:", error);
    }
  }, []);
  
  // Save recent media to localStorage
  const saveToRecent = (url: string) => {
    if (!url || recentMedia.includes(url)) return;
    
    const updated = [url, ...recentMedia].slice(0, 10); // Keep last 10
    setRecentMedia(updated);
    
    try {
      localStorage.setItem('recentMedia', JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving recent media:", error);
    }
  };
  
  const handleMediaSelect = () => {
    if (isValidMediaUrl(mediaUrl)) {
      saveToRecent(mediaUrl);
      onSelectMedia(mediaUrl);
    }
  };
  
  const validateUrl = (url: string) => {
    if (!url) {
      setIsValid(true);
      return;
    }
    
    const valid = isValidMediaUrl(url);
    
    if (valid && allowedTypes.length > 0) {
      const type = extractMediaType(url);
      setIsValid(
        (type === 'video' && allowedTypes.includes('video')) || 
        (type === 'audio' && allowedTypes.includes('audio'))
      );
    } else {
      setIsValid(valid);
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMediaUrl(url);
    validateUrl(url);
  };
  
  const handleRecentSelect = (url: string) => {
    setMediaUrl(url);
    validateUrl(url);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {defaultValue ? 'Change Media' : 'Add Media'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter media URL"
                value={mediaUrl}
                onChange={handleUrlChange}
                className={!isValid ? "border-red-500" : ""}
              />
              <Button onClick={handleMediaSelect} disabled={!isValid || !mediaUrl}>
                Select
              </Button>
            </div>
            
            {!isValid && (
              <div className="flex items-center text-sm text-red-500">
                <AlertCircle className="mr-1 h-4 w-4" />
                <span>Invalid media URL or unsupported type</span>
              </div>
            )}
          </div>
          
          {/* Media Preview */}
          {mediaUrl && isValid && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-discord-secondary-text">Preview</h3>
              <MediaPlayer url={mediaUrl} />
            </div>
          )}
          
          {/* Recent Media */}
          {recentMedia.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-discord-secondary-text">Recent Media</h3>
              <div className="grid grid-cols-3 gap-2">
                {recentMedia.map((url, index) => {
                  const type = extractMediaType(url);
                  let icon = <Image className="h-5 w-5" />;
                  
                  if (type === 'video') {
                    icon = <FileVideo className="h-5 w-5" />;
                  } else if (type === 'audio') {
                    icon = <FileAudio className="h-5 w-5" />;
                  }
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="flex items-center justify-start overflow-hidden"
                      onClick={() => handleRecentSelect(url)}
                    >
                      {icon}
                      <span className="ml-2 truncate text-xs">{url.split('/').pop()}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaBrowser;
