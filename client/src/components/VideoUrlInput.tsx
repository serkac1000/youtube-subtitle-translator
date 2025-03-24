import React, { useState } from 'react';

interface VideoUrlInputProps {
  onVideoIdChange: (videoId: string) => void;
  currentVideoId: string;
}

const VideoUrlInput: React.FC<VideoUrlInputProps> = ({ onVideoIdChange, currentVideoId }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    // If the input is empty, do nothing
    if (!inputValue.trim()) {
      setError('Please enter a YouTube URL or video ID');
      return;
    }
    
    try {
      // Extract video ID from different YouTube URL formats or use as is if it's just the ID
      let videoId = inputValue.trim();
      
      // Check if it's a full YouTube URL
      if (videoId.includes('youtube.com/watch?v=')) {
        // Extract from standard YouTube watch URL
        const url = new URL(videoId);
        const params = new URLSearchParams(url.search);
        videoId = params.get('v') || '';
      } else if (videoId.includes('youtu.be/')) {
        // Extract from shortened youtu.be URL
        videoId = videoId.split('youtu.be/')[1];
        // Remove any parameters
        videoId = videoId.split('?')[0];
      } else if (videoId.includes('youtube.com/embed/')) {
        // Extract from embed URL
        videoId = videoId.split('youtube.com/embed/')[1];
        // Remove any parameters
        videoId = videoId.split('?')[0];
      }
      
      // Validate the extracted or provided video ID
      if (!videoId) {
        setError('Could not extract video ID from the URL');
        return;
      }
      
      // Simple validation - YouTube IDs are typically 11 characters
      if (videoId.length !== 11) {
        setError('Invalid YouTube video ID format');
        return;
      }
      
      // Call the parent component's handler with the extracted video ID
      onVideoIdChange(videoId);
      
      // Clear the input field after successful submission
      setInputValue('');
    } catch (err) {
      console.error('Error parsing YouTube URL:', err);
      setError('Invalid YouTube URL format');
    }
  };

  return (
    <div className="w-full max-w-4xl mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Enter YouTube URL or video ID (e.g., dQw4w9WgXcQ)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>
        <button
          type="submit"
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <span className="material-icons mr-1">play_circle</span>
          Load Video
        </button>
      </form>
      <div className="mt-2 text-sm text-gray-600">
        <p>
          Current video ID: <span className="font-mono">{currentVideoId}</span> - 
          <a 
            href={`https://www.youtube.com/watch?v=${currentVideoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-red-600 hover:underline ml-1"
          >
            View on YouTube
          </a>
        </p>
      </div>
    </div>
  );
};

export default VideoUrlInput;