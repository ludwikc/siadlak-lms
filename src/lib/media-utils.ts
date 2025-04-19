
type MediaType = 'video' | 'audio' | 'unknown';
type Platform = 'youtube' | 'vimeo' | 'loom' | 'bunnynet' | 'spotify' | 'spreaker' | 'other';

interface EmbedOptions {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  title?: string;
}

/**
 * Extracts the media type from the provided URL
 */
export const extractMediaType = (url: string): MediaType => {
  if (!url) return 'unknown';
  
  // Video platforms
  if (
    url.includes('youtube.com') || 
    url.includes('youtu.be') || 
    url.includes('vimeo.com') || 
    url.includes('loom.com') || 
    url.includes('mediadelivery.net') ||
    url.includes('bunny.net')
  ) {
    return 'video';
  }
  
  // Audio platforms
  if (
    url.includes('spotify.com') || 
    url.includes('spreaker.com')
  ) {
    return 'audio';
  }
  
  // Try to determine by file extension
  const extensions = url.split('.').pop()?.toLowerCase();
  if (extensions) {
    if (['mp4', 'webm', 'mov', 'avi'].includes(extensions)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extensions)) {
      return 'audio';
    }
  }
  
  return 'unknown';
};

/**
 * Determines the platform from the provided URL
 */
export const detectPlatform = (url: string): Platform => {
  if (!url) return 'other';
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  if (url.includes('loom.com')) {
    return 'loom';
  }
  
  if (url.includes('mediadelivery.net') || url.includes('bunny.net')) {
    return 'bunnynet';
  }
  
  if (url.includes('spotify.com')) {
    return 'spotify';
  }
  
  if (url.includes('spreaker.com')) {
    return 'spreaker';
  }
  
  return 'other';
};

/**
 * Extracts video ID from various platforms
 */
export const extractVideoId = (url: string, platform: Platform): string | null => {
  if (!url) return null;
  
  switch (platform) {
    case 'youtube': {
      // Handle youtube.com/watch?v=ID
      const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (watchMatch) return watchMatch[1];
      return null;
    }
    
    case 'vimeo': {
      // Handle vimeo.com/ID
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match) return match[1];
      return null;
    }
    
    case 'loom': {
      // Handle loom.com/share/ID
      const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
      if (match) return match[1];
      return null;
    }
    
    case 'bunnynet': {
      // Handle iframe.mediadelivery.net/embed/LIBRARY/ID
      const match = url.match(/mediadelivery\.net\/embed\/([^/]+)\/([^/?&]+)/);
      if (match) return `${match[1]}/${match[2]}`;
      
      // Handle direct bunny URL with library ID and video ID
      const directMatch = url.match(/embed\/(\d+)\/([a-zA-Z0-9-]+)/);
      if (directMatch) return `${directMatch[1]}/${directMatch[2]}`;
      
      return null;
    }
    
    default:
      return null;
  }
};

/**
 * Generates embed code for various media types and platforms
 */
export const generateEmbedCode = (url: string, options: EmbedOptions = {}): string => {
  const platform = detectPlatform(url);
  const mediaType = extractMediaType(url);
  
  // Default options
  const { 
    autoplay = false, 
    controls = true, 
    loop = false, 
    muted = false,
    title = 'Media content'
  } = options;
  
  // Handle different platforms
  switch (platform) {
    case 'youtube': {
      const videoId = extractVideoId(url, platform);
      if (!videoId) return '<div>Invalid YouTube URL</div>';
      
      return `<iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}" 
        title="${title}"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        style="position:absolute;top:0;left:0;width:100%;height:100%;"
      ></iframe>`;
    }
    
    case 'vimeo': {
      const videoId = extractVideoId(url, platform);
      if (!videoId) return '<div>Invalid Vimeo URL</div>';
      
      return `<iframe 
        src="https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}" 
        title="${title}"
        frameborder="0" 
        allow="autoplay; fullscreen; picture-in-picture" 
        allowfullscreen
        style="position:absolute;top:0;left:0;width:100%;height:100%;"
      ></iframe>`;
    }
    
    case 'loom': {
      const videoId = extractVideoId(url, platform);
      if (!videoId) return '<div>Invalid Loom URL</div>';
      
      return `<iframe 
        src="https://www.loom.com/embed/${videoId}" 
        title="${title}"
        frameborder="0" 
        allowfullscreen
        style="position:absolute;top:0;left:0;width:100%;height:100%;"
      ></iframe>`;
    }
    
    case 'bunnynet': {
      // If it's a full iframe code, use it directly
      if (url.includes('<iframe')) {
        return url;
      }
      
      const idParts = extractVideoId(url, platform);
      if (!idParts) return '<div>Invalid Bunny.net URL</div>';
      
      const [libraryId, videoId] = idParts.split('/');
      
      return `<iframe 
        src="https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=${autoplay}&loop=${loop}&muted=${muted}&preload=false&responsive=true" 
        loading="lazy" 
        title="${title}"
        style="border:0;position:absolute;top:0;height:100%;width:100%;" 
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" 
        allowfullscreen="true"
      ></iframe>`;
    }
    
    case 'spotify': {
      // Check if it's a track, album, or playlist
      let embedUrl = '';
      
      if (url.includes('/track/')) {
        const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
        if (match) embedUrl = `https://open.spotify.com/embed/track/${match[1]}`;
      } else if (url.includes('/album/')) {
        const match = url.match(/\/album\/([a-zA-Z0-9]+)/);
        if (match) embedUrl = `https://open.spotify.com/embed/album/${match[1]}`;
      } else if (url.includes('/playlist/')) {
        const match = url.match(/\/playlist\/([a-zA-Z0-9]+)/);
        if (match) embedUrl = `https://open.spotify.com/embed/playlist/${match[1]}`;
      }
      
      if (!embedUrl) return '<div>Invalid Spotify URL</div>';
      
      return `<iframe 
        src="${embedUrl}" 
        width="100%" 
        height="152" 
        frameborder="0" 
        allowtransparency="true" 
        allow="encrypted-media"
      ></iframe>`;
    }
    
    case 'spreaker': {
      // Extract episode ID
      const match = url.match(/episode\/(\d+)/);
      if (!match) return '<div>Invalid Spreaker URL</div>';
      
      const episodeId = match[1];
      
      return `<iframe 
        src="https://widget.spreaker.com/player?episode_id=${episodeId}&theme=dark" 
        width="100%" 
        height="200px" 
        frameborder="0"
      ></iframe>`;
    }
    
    default: {
      if (mediaType === 'video') {
        return `<video
          src="${url}" 
          ${controls ? 'controls' : ''}
          ${autoplay ? 'autoplay' : ''}
          ${loop ? 'loop' : ''}
          ${muted ? 'muted' : ''}
          style="width:100%;height:100%;"
        ></video>`;
      }
      
      if (mediaType === 'audio') {
        return `<audio
          src="${url}"
          ${controls ? 'controls' : ''}
          ${autoplay ? 'autoplay' : ''}
          ${loop ? 'loop' : ''}
          ${muted ? 'muted' : ''}
          style="width:100%;"
        ></audio>`;
      }
      
      return `<div>Unsupported media URL</div>`;
    }
  }
};

/**
 * Attempts to extract a thumbnail URL from a video URL
 */
export const extractThumbnail = async (url: string): Promise<string | null> => {
  const platform = detectPlatform(url);
  
  switch (platform) {
    case 'youtube': {
      const videoId = extractVideoId(url, platform);
      if (!videoId) return null;
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    case 'vimeo': {
      const videoId = extractVideoId(url, platform);
      if (!videoId) return null;
      
      try {
        // This requires server-side fetching in a real implementation
        // Mock implementation for now
        return `https://vumbnail.com/${videoId}.jpg`;
      } catch (error) {
        console.error("Failed to extract Vimeo thumbnail:", error);
        return null;
      }
    }
    
    default:
      return null;
  }
};

/**
 * Validates if a URL is a valid media URL
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return extractMediaType(url) !== 'unknown';
  } catch (e) {
    return false;
  }
};
