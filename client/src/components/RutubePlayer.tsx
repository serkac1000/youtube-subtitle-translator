import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import VideoInfo from './VideoInfo';
import DebugPanel from './DebugPanel';
import { SubtitleTrack, VideoDetails } from '../types';
import { parseSubtitles } from '../lib/subtitleParser';
import { apiRequest } from '../lib/queryClient';
import { isSpeechRecognitionSupported } from '../lib/speechRecognition';

interface RutubePlayerProps {
  videoId: string;
  initialLanguage?: string;
  autoplay?: boolean;
}

const RutubePlayer: React.FC<RutubePlayerProps> = ({
  videoId,
  initialLanguage = 'ru',
  autoplay = false
}) => {
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SubtitleTrack | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails>({
    videoId,
    title: 'Loading...',
    viewCount: '...',
    uploadDate: '...'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeechToTextSupported, setIsSpeechToTextSupported] = useState(false);

  // Check if speech-to-text is supported
  useEffect(() => {
    setIsSpeechToTextSupported(isSpeechRecognitionSupported());
  }, []);

  // Load subtitles and video details
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch video details
        const videoResponse = await apiRequest('GET', `/api/videos/${videoId}`, undefined);
        const videoData = await videoResponse.json();
        setVideoDetails(videoData);
        
        // Fetch available subtitles only if needed
        // If we're using speech-to-text, we might not need to fetch predefined subtitles
        if (!isSpeechToTextSupported || initialLanguage !== 'ru') {
          const subtitlesResponse = await apiRequest('GET', `/api/subtitles/${videoId}`, undefined);
          const subtitlesData = await subtitlesResponse.json();
          
          // Parse subtitles
          const parsedTracks = subtitlesData.map((subtitle: {
            content: string;
            language: string;
            label: string;
          }) => parseSubtitles(subtitle.content, subtitle.language, subtitle.label));
          
          setSubtitleTracks(parsedTracks);
          
          // Set initial subtitle track if available
          if (initialLanguage && parsedTracks.length > 0 && !isSpeechToTextSupported) {
            const initialTrack = parsedTracks.find(track => track.language === initialLanguage);
            if (initialTrack) {
              setSelectedTrack(initialTrack);
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load video data or subtitles.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [videoId, initialLanguage, isSpeechToTextSupported]);
  
  // Handle track change
  const handleTrackChange = (track: SubtitleTrack | null) => {
    setSelectedTrack(track);
    
    // If track is a speech recognition track, add it to the available tracks
    if (track && track.id.startsWith('track-speech') && !subtitleTracks.some((t: SubtitleTrack) => t.id === track.id)) {
      setSubtitleTracks(prev => [...prev, track]);
    }
  };
  
  // Debug panel test functions
  const handleTestSubtitle = () => {
    if (isSpeechToTextSupported) {
      // We'll let the VideoPlayer handle speech recognition
      // It will automatically create a speech recognition track
      console.log('Starting speech recognition for testing');
    } else {
      // Find Russian track and select it
      const russianTrack = subtitleTracks.find(track => track.language === 'ru');
      if (russianTrack) {
        setSelectedTrack(russianTrack);
      }
    }
  };
  
  const handleLoadAlternative = async () => {
    try {
      const response = await apiRequest('GET', `/api/subtitles/${videoId}/alternative`, undefined);
      const data = await response.json();
      
      if (data && data.content) {
        const altTrack = parseSubtitles(data.content, data.language, data.label);
        
        // Add to tracks if not already present
        if (!subtitleTracks.some(track => track.id === altTrack.id)) {
          setSubtitleTracks(prev => [...prev, altTrack]);
        }
        
        // Select the alternative track
        setSelectedTrack(altTrack);
      }
    } catch (err) {
      console.error('Error loading alternative subtitle:', err);
    }
  };
  
  const handleToggleDebug = () => {
    console.log('Debug overlay toggled');
    // Implement debug overlay if needed
  };
  
  const handleCheckEncoding = () => {
    if (!selectedTrack) {
      console.log('No subtitle track selected');
      return;
    }
    
    // Log selected track details and a sample of cues for debugging
    console.log('Selected track:', selectedTrack);
    console.log('Sample cues:', selectedTrack.cues.slice(0, 3));
    console.log('Encoding check: Cyrillic characters should display correctly: абвгдеёжзийклмнопрстуфхцчшщъыьэюя');
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <header className="w-full max-w-4xl mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-red-600">Rutube Web</h1>
          <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">Speech-to-Text Version</span>
        </div>
        <div className="flex items-center space-x-4">
          {isSpeechToTextSupported && (
            <div className="text-green-600 flex items-center mr-4">
              <span className="material-icons text-sm mr-1">mic</span>
              <span className="text-xs">Speech Recognition Available</span>
            </div>
          )}
          <button className="text-gray-700 hover:text-red-600">
            <span className="material-icons">help_outline</span>
          </button>
          <button className="text-gray-700 hover:text-red-600">
            <span className="material-icons">account_circle</span>
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="w-full max-w-4xl bg-white p-12 rounded shadow flex justify-center items-center">
          <span className="material-icons animate-spin mr-2">refresh</span>
          <span>Loading player...</span>
        </div>
      ) : error ? (
        <div className="w-full max-w-4xl bg-red-50 p-6 rounded shadow text-red-600">
          <h3 className="font-bold flex items-center">
            <span className="material-icons mr-2">error</span>
            Error
          </h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <VideoPlayer
            videoId={videoId}
            subtitleTracks={subtitleTracks}
            selectedTrack={selectedTrack}
            onTrackChange={handleTrackChange}
          />
          
          <VideoInfo videoDetails={videoDetails} />
          
          <DebugPanel
            selectedTrack={selectedTrack}
            onTestSubtitle={handleTestSubtitle}
            onLoadAlternative={handleLoadAlternative}
            onToggleDebug={handleToggleDebug}
            onCheckEncoding={handleCheckEncoding}
          />

          {!isSpeechToTextSupported && (
            <div className="w-full max-w-4xl mt-4 bg-yellow-50 p-4 rounded shadow text-yellow-700">
              <h3 className="font-bold flex items-center">
                <span className="material-icons mr-2">warning</span>
                Speech Recognition Not Available
              </h3>
              <p className="mt-2">
                Your browser does not support the Web Speech API needed for speech-to-text subtitle generation.
                Please use Google Chrome, Microsoft Edge, or another compatible browser for this feature.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RutubePlayer;
