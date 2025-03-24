import React, { useState, useRef, useEffect } from 'react';
import { SubtitleCue } from '@shared/types';

interface VideoPlayerProps {
  youtubeUrl: string;
  subtitle: string | null;
  onVideoLoad?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  youtubeUrl, 
  subtitle,
  onVideoLoad 
}) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);

  // Extract YouTube video ID from URL
  useEffect(() => {
    if (youtubeUrl) {
      try {
        // Handle different YouTube URL formats
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = youtubeUrl.match(regex);
        
        if (match && match[1]) {
          const id = match[1];
          setVideoId(id);
          setIsLoading(true);
        } else {
          setVideoId(null);
        }
      } catch (error) {
        console.error('Error parsing YouTube URL:', error);
        setVideoId(null);
      }
    } else {
      setVideoId(null);
    }
  }, [youtubeUrl]);

  // Initialize YouTube player
  useEffect(() => {
    // Define the callback in the window object
    (window as any).onYouTubeIframeAPIReady = () => {
      if (videoId && playerRef.current) {
        createYouTubePlayer(videoId);
      }
    };
    
    // Check if the API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      if (videoId && playerRef.current) {
        createYouTubePlayer(videoId);
      }
    } else {
      // Load YouTube iFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      // Find first script element and insert before it
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        // Fallback - append to head
        document.head.appendChild(tag);
      }
    }

    return () => {
      // Clean up player on unmount
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying YouTube player:', err);
        }
      }
    };
  }, []);

  // Update player when video ID changes
  useEffect(() => {
    if (videoId && (window as any).YT && (window as any).YT.Player) {
      createYouTubePlayer(videoId);
    }
  }, [videoId]);

  const createYouTubePlayer = (id: string) => {
    // Destroy existing player if it exists
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
    }

    if (!playerRef.current) return;

    try {
      // Create a new player instance
      youtubePlayerRef.current = new (window as any).YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId: id,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsLoading(false);
            if (onVideoLoad) onVideoLoad();
          },
          onError: (error: any) => {
            console.error('YouTube Player Error:', error);
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-black relative" style={{ height: '40%' }}>
      {!videoId && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-3 text-gray-500">
              <span className="material-icons text-5xl">play_circle_outline</span>
            </div>
            <p className="text-gray-400">YouTube video will appear here</p>
            <p className="text-sm text-gray-500 mt-2">Enter a YouTube URL to begin</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-300 mt-4">Loading video...</p>
          </div>
        </div>
      )}

      <div ref={playerRef} className="w-full h-full"></div>
      
      {/* Subtitles overlay */}
      {subtitle && (
        <div className="absolute bottom-4 left-0 right-0 mx-auto text-center z-10">
          <div className="inline-block bg-black bg-opacity-80 text-white px-4 py-2 rounded text-lg max-w-[90%]">
            {subtitle}
          </div>
        </div>
      )}
      {!subtitle && (
        <div className="absolute bottom-4 left-0 right-0 mx-auto text-center z-10">
          <div className="inline-block bg-black bg-opacity-80 text-gray-400 px-4 py-2 rounded text-lg">
            Waiting for speech...
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
