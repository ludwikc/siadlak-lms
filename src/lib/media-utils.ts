
/**
 * Extract the type of media from a URL
 * @param url The URL of the media
 * @returns The media type (video, audio, or unknown)
 */
export const extractMediaType = (url: string): string => {
  if (!url) return 'unknown';
  
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac'];
  
  // Check for YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'video';
  }
  
  // Check for Vimeo
  if (url.includes('vimeo.com')) {
    return 'video';
  }
  
  // Check for file extension
  const extension = url.split('.').pop()?.toLowerCase();
  if (extension) {
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
  }
  
  return 'unknown';
};

/**
 * Check if a URL is a valid media URL
 * @param url The URL to check
 * @returns True if the URL is a valid media URL, false otherwise
 */
export const isValidMediaUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  
  try {
    // Check if it's a valid URL
    new URL(url);
    
    // Check if it's a known media provider or has a valid media extension
    const mediaType = extractMediaType(url);
    
    return mediaType !== 'unknown';
  } catch (error) {
    // If URL constructor throws an error, it's not a valid URL
    return false;
  }
};

/**
 * Generate HTML embed code for media
 * @param url Media URL
 * @param options Options for the embed
 * @returns HTML string for embedding
 */
export const generateEmbedCode = (url: string, options: { 
  autoplay?: boolean; 
  controls?: boolean; 
  title?: string;
}) => {
  const mediaType = extractMediaType(url);
  const { autoplay = false, controls = true, title = '' } = options;
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtube.com') 
      ? new URL(url).searchParams.get('v') 
      : url.split('/').pop();
    
    return `<iframe 
      width="100%" 
      height="100%" 
      src="https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}" 
      title="${title}"
      frameborder="0" 
      allow="accelerometer; ${autoplay ? 'autoplay; ' : ''}clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>`;
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop();
    return `<iframe 
      width="100%" 
      height="100%" 
      src="https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}" 
      title="${title}"
      frameborder="0" 
      allow="autoplay; fullscreen; picture-in-picture" 
      allowfullscreen>
    </iframe>`;
  }
  
  // Direct video file
  if (mediaType === 'video') {
    return `<video 
      width="100%" 
      height="100%" 
      ${controls ? 'controls' : ''} 
      ${autoplay ? 'autoplay' : ''} 
      title="${title}">
      <source src="${url}" type="video/${url.split('.').pop()}">
      Your browser does not support the video tag.
    </video>`;
  }
  
  // Direct audio file
  if (mediaType === 'audio') {
    return `<audio 
      width="100%" 
      ${controls ? 'controls' : ''} 
      ${autoplay ? 'autoplay' : ''}>
      <source src="${url}" type="audio/${url.split('.').pop()}">
      Your browser does not support the audio tag.
    </audio>`;
  }
  
  // Unknown/unsupported
  return `<div>Unsupported media format for URL: ${url}</div>`;
};
