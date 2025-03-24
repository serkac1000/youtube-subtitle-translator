import React, { useState, useRef, useEffect } from 'react';
import { SubtitleTrack, SubtitleCue, PlayerState } from '../types';
import { formatTime } from '../lib/timeUtils';
import { 
  SpeechToTextService, 
  isSpeechRecognitionSupported,
  isRestrictedEnvironment 
} from '../lib/speechRecognition';
import { logger } from './debug/DebugLogger';
import SubtitleControl from './SubtitleControl';
import DebugConsole from './debug/DebugConsole';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoId: string;
  subtitleTracks: SubtitleTrack[];
  selectedTrack: SubtitleTrack | null;
  onTrackChange: (track: SubtitleTrack | null) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  subtitleTracks, 
  selectedTrack, 
  onTrackChange 
}) => {
  // State variables
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('unstarted');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useSpeechRecognition, setUseSpeechRecognition] = useState(true);
  const [speechToTextEnabled, setSpeechToTextEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ru-RU');
  const [isSTTSupported, setIsSTTSupported] = useState(false);
  const [isRestrictedEnv, setIsRestrictedEnv] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [speechRecStatus, setSpeechRecStatus] = useState<'disabled' | 'active' | 'error' | 'fallback'>('disabled');
  const { toast } = useToast();
  
  // Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<number | null>(null);
  const speechToTextService = useRef<SpeechToTextService | null>(null);
  
  // Check browser compatibility for speech recognition
  useEffect(() => {
    const speechSupported = isSpeechRecognitionSupported();
    setIsSTTSupported(speechSupported);
    setIsRestrictedEnv(isRestrictedEnvironment());
    
    logger.info('speech', 'Speech recognition support check', { 
      supported: speechSupported,
      restrictedEnvironment: isRestrictedEnvironment()
    });
    
    if (!speechSupported) {
      logger.warn('speech', 'Speech recognition is not supported in this browser');
    }
    
    if (isRestrictedEnvironment()) {
      logger.warn('speech', 'Running in a restricted environment (like Replit) which may limit speech recognition');
    }
  }, []);
  
  // Initialize speech recognition service
  useEffect(() => {
    if (!isSTTSupported) return;
    
    logger.info('speech', 'Initializing speech recognition service', { language: currentLanguage });
    
    // Initialize the speech-to-text service with error callbacks
    speechToTextService.current = new SpeechToTextService(
      { language: currentLanguage, continuous: true, interimResults: true },
      (transcript, cues) => {
        // Update the current subtitle with the latest transcript
        if (speechToTextEnabled) {
          setCurrentSubtitle(transcript);
          
          // If we have a newly generated track, update it
          if (selectedTrack && selectedTrack.id.startsWith('track-speech')) {
            const updatedTrack: SubtitleTrack = {
              ...selectedTrack,
              cues: [...cues]
            };
            onTrackChange(updatedTrack);
          }
        }
      },
      {
        onError: (error, isFatal) => {
          logger.error('speech', `Speech recognition error: ${error}`, { isFatal });
          
          // Show toast notification for important errors
          if (isFatal) {
            toast({
              title: "Speech Recognition Error",
              description: error,
              variant: "destructive",
              action: (
                <button 
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs" 
                  onClick={() => setShowDebugConsole(true)}
                >
                  Debug
                </button>
              )
            });
            
            setSpeechRecStatus('error');
            
            // Create a fallback subtitle if we're in a fatal error state
            if (speechToTextService.current && speechToTextEnabled) {
              speechToTextService.current.createFallbackSubtitle(
                "Speech recognition failed. Using fallback mode."
              );
              
              setSpeechRecStatus('fallback');
            }
          }
        },
        onStatusChange: (status) => {
          logger.info('speech', `Speech recognition status: ${status}`);
          
          if (status === 'error') {
            setSpeechRecStatus('error');
          } else if (status === 'listening') {
            setSpeechRecStatus('active');
          }
        }
      }
    );
    
    return () => {
      // Cleanup speech recognition
      if (speechToTextService.current) {
        logger.info('speech', 'Cleaning up speech recognition');
        speechToTextService.current.stop();
      }
    };
  }, [isSTTSupported, currentLanguage]);
  
  // Handle speech recognition based on player state and retry on failures
  useEffect(() => {
    if (!speechToTextService.current || !isSTTSupported || !useSpeechRecognition) return;
    
    logger.debug('speech', 'Player state changed', { 
      state: playerState, 
      speechEnabled: speechToTextEnabled 
    });
    
    if (playerState === 'playing' && !speechToTextEnabled) {
      logger.info('speech', 'Starting speech recognition based on player state');
      setSpeechToTextEnabled(true);
      speechToTextService.current.start();
      
      // Create a new subtitle track for speech recognition if we're not in fallback mode
      if (!speechToTextService.current.isInFallbackMode()) {
        const speechTrack: SubtitleTrack = speechToTextService.current.getCurrentSubtitleTrack();
        onTrackChange(speechTrack);
      } else {
        // In fallback mode, create a message to indicate we're using fallback
        logger.warn('speech', 'Using fallback mode for subtitles');
        speechToTextService.current.createFallbackSubtitle(
          "Using fallback subtitle mode due to speech recognition limitations."
        );
        setSpeechRecStatus('fallback');
      }
      
    } else if (playerState !== 'playing' && speechToTextEnabled) {
      logger.info('speech', 'Stopping speech recognition based on player state');
      setSpeechToTextEnabled(false);
      speechToTextService.current.stop();
    }
  }, [playerState, useSpeechRecognition, isSTTSupported]);
  
  // Display warning toast in restricted environments (like Replit)
  useEffect(() => {
    if (isRestrictedEnv && isSTTSupported) {
      logger.warn('speech', 'Running in a restricted environment that may affect speech recognition');
      
      // Show a toast notification after a short delay
      const timer = setTimeout(() => {
        toast({
          title: "Limited Environment Detected",
          description: "Speech recognition may have limited functionality in this environment (like Replit). Click Debug for more options.",
          duration: 6000,
          action: (
            <button 
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs" 
              onClick={() => setShowDebugConsole(true)}
            >
              Debug
            </button>
          )
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isRestrictedEnv, isSTTSupported]);
  
  // Change speech recognition language
  const changeSpeechRecognitionLanguage = (language: string) => {
    if (!speechToTextService.current) return;
    
    logger.info('speech', `Changing speech recognition language to: ${language}`);
    setCurrentLanguage(language);
    speechToTextService.current.changeLanguage(language);
    
    // Update the track
    if (speechToTextEnabled) {
      const updatedTrack = speechToTextService.current.getCurrentSubtitleTrack();
      onTrackChange(updatedTrack);
    }
  };
  
  // Load YouTube API and initialize player
  useEffect(() => {
    // Clean up previous player if it exists
    if (player) {
      player.destroy();
      setPlayer(null);
    }
    
    // Reset state when video ID changes
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    setCurrentSubtitle('');
    
    // Clear any previous progress tracking interval
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    logger.info('player', `Initializing YouTube player for video: ${videoId}`);
    
    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      // If API is already loaded, initialize the player directly
      initializePlayer();
    } else {
      // If API is not loaded yet, load it
      logger.info('player', 'Loading YouTube IFrame API');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      window.onYouTubeIframeAPIReady = initializePlayer;
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    return () => {
      // Clean up on component unmount or when videoId changes
      if (player) {
        player.destroy();
      }
      
      window.onYouTubeIframeAPIReady = null;
      
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    };
  }, [videoId]);
  
  // Initialize player once YouTube API is loaded
  const initializePlayer = () => {
    if (!playerRef.current) return;
    
    // We need to make sure the player container is empty before creating a new player
    // First, check if the ref still has a child element
    while (playerRef.current.firstChild) {
      playerRef.current.removeChild(playerRef.current.firstChild);
    }
    
    // Create a new div element to host the player
    const playerElement = document.createElement('div');
    playerElement.id = 'youtube-player-element';
    playerRef.current.appendChild(playerElement);
    
    try {
      logger.info('player', 'Creating YouTube player instance');
      const ytPlayer = new YT.Player(playerElement, {
        videoId,
        playerVars: {
          autoplay: 1, // Set to 1 to autoplay
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          cc_load_policy: 0, // Disable YouTube's built-in captions
          cc_lang_pref: 'ru' // Set default subtitle language if needed
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: (event) => {
            logger.error('player', 'YouTube player error', { errorCode: event.data });
          }
        }
      });
      
      setPlayer(ytPlayer);
    } catch (error) {
      logger.error('player', 'Error initializing YouTube player', { error });
    }
  };
  
  // Player ready event handler
  const onPlayerReady = (event: YT.PlayerEvent) => {
    logger.info('player', 'YouTube player ready');
    setDuration(event.target.getDuration());
    startProgressTracking();
  };
  
  // Player state change event handler
  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        logger.debug('player', 'Player state: PLAYING');
        setPlayerState('playing');
        break;
      case YT.PlayerState.PAUSED:
        logger.debug('player', 'Player state: PAUSED');
        setPlayerState('paused');
        break;
      case YT.PlayerState.ENDED:
        logger.debug('player', 'Player state: ENDED');
        setPlayerState('ended');
        break;
      case YT.PlayerState.BUFFERING:
        logger.debug('player', 'Player state: BUFFERING');
        setPlayerState('buffering');
        break;
      case YT.PlayerState.CUED:
        logger.debug('player', 'Player state: CUED');
        setPlayerState('cued');
        break;
      default:
        logger.debug('player', 'Player state: UNSTARTED');
        setPlayerState('unstarted');
    }
  };
  
  // Start tracking video progress
  const startProgressTracking = () => {
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
    }
    
    progressInterval.current = window.setInterval(() => {
      if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        setCurrentTime(currentTime);
        
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
        
        // Update current subtitle only if not using speech recognition
        if (!speechToTextEnabled) {
          updateCurrentSubtitle(currentTime);
        }
      }
    }, 100); // Update every 100ms for smoother progress
  };
  
  // Update current subtitle based on current time
  const updateCurrentSubtitle = (time: number) => {
    // If speech recognition is enabled, skip this update as speech recognition handles subtitles
    if (!selectedTrack || speechToTextEnabled) {
      return;
    }
    
    // Find any cue that should be active at the current time
    const activeCue = selectedTrack.cues.find(
      cue => time >= cue.start && time <= cue.end
    );
    
    // Set the current subtitle text (empty string if no active cue found)
    setCurrentSubtitle(activeCue ? activeCue.text : '');
    
    // Debug log to help troubleshoot subtitle timing issues
    if (activeCue && activeCue.text.match(/[а-яА-Я]/)) {
      logger.debug('subtitles', 'Showing Russian subtitle', { 
        time, 
        text: activeCue.text, 
        start: activeCue.start, 
        end: activeCue.end 
      });
    }
  };
  
  // Play/pause toggle
  const togglePlayPause = () => {
    if (!player) return;
    
    if (playerState === 'playing') {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };
  
  // Set volume
  const handleVolumeChange = (newVolume: number) => {
    if (!player) return;
    
    setVolume(newVolume);
    player.setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      player.unMute();
      setIsMuted(false);
    }
  };
  
  // Handle seeking (clicking progress bar)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !duration) return;
    
    const progressBar = e.currentTarget;
    const bounds = progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percent = x / progressBar.offsetWidth;
    const seekTime = duration * percent;
    
    player.seekTo(seekTime, true);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        logger.error('player', `Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!isSTTSupported) return;
    
    // Toggle the state
    const newState = !useSpeechRecognition;
    setUseSpeechRecognition(newState);
    
    logger.info('speech', newState ? 'Enabling speech recognition' : 'Disabling speech recognition');
    
    if (newState) {
      // Starting speech recognition
      if (speechToTextService.current) {
        // Make sure to stop any existing recognition first
        speechToTextService.current.stop();
        
        // Start fresh
        setTimeout(() => {
          if (speechToTextService.current) {
            logger.info('speech', 'Starting speech recognition manually');
            setSpeechToTextEnabled(true);
            
            // If player is not playing, start it
            if (playerState !== 'playing' && player) {
              player.playVideo();
            }
            
            speechToTextService.current.start();
            
            // Create a new subtitle track for speech recognition
            const speechTrack = speechToTextService.current.getCurrentSubtitleTrack();
            onTrackChange(speechTrack);
            setSpeechRecStatus('active');
          }
        }, 300);
      }
    } else {
      // Stopping speech recognition
      if (speechToTextService.current) {
        logger.info('speech', 'Stopping speech recognition manually');
        setSpeechToTextEnabled(false);
        speechToTextService.current.stop();
        
        // Clear the current subtitle
        setCurrentSubtitle('');
        
        // Clear any selected speech track
        if (selectedTrack && selectedTrack.id.startsWith('track-speech')) {
          onTrackChange(null);
        }
        
        setSpeechRecStatus('disabled');
      }
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Get volume icon based on volume state
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return 'volume_off';
    } else if (volume < 50) {
      return 'volume_down';
    } else {
      return 'volume_up';
    }
  };
  
  // Toggle debug console
  const toggleDebugConsole = () => {
    setShowDebugConsole(!showDebugConsole);
  };
  
  // For testing purposes - force speech recognition to use fallback
  const testFallbackMode = () => {
    if (speechToTextService.current && speechToTextEnabled) {
      logger.info('speech', 'Testing fallback mode');
      
      // Create a sample fallback subtitle
      speechToTextService.current.createFallbackSubtitle(
        "This is a fallback subtitle for testing purposes."
      );
      
      // Show a toast notification
      toast({
        title: "Fallback Mode Testing",
        description: "Created a test fallback subtitle",
        variant: "default"
      });
    }
  };
  
  return (
    <div
      className="w-full max-w-4xl bg-playerBg rounded-lg shadow-lg overflow-hidden"
      id="video-container"
      ref={playerContainerRef}
    >
      <div className="relative" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {/* YouTube Player will be inserted here */}
          <div id="video-player" ref={playerRef} className="w-full h-full"></div>
          
          {/* Subtitles Overlay */}
          <div
            id="subtitle-container"
            className="absolute bottom-16 left-0 right-0 text-center px-4 py-2"
          >
            {currentSubtitle && (
              <p
                id="subtitle-text"
                className={`inline-block bg-black bg-opacity-60 text-white px-3 py-1 rounded text-lg max-w-lg mx-auto ${
                  speechToTextEnabled 
                    ? speechRecStatus === 'fallback' 
                      ? 'border border-yellow-500'
                      : speechRecStatus === 'error' 
                        ? 'border border-red-500' 
                        : 'border border-green-500'
                    : ''
                }`}
              >
                {currentSubtitle}
              </p>
            )}
          </div>
          
          {/* Video Controls */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
            id="video-controls"
          >
            {/* Progress Bar */}
            <div
              className="w-full h-1 bg-gray-600 rounded-full mb-4 relative group cursor-pointer"
              onClick={handleSeek}
            >
              <div
                id="progress-bar"
                className="h-full bg-red-600 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
              <div
                className="absolute hidden group-hover:block h-3 w-3 bg-red-600 rounded-full -top-1 -mt-px"
                style={{ left: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  id="play-pause-btn"
                  className="text-white mr-4 focus:outline-none"
                  onClick={togglePlayPause}
                >
                  <span className="material-icons text-2xl">
                    {playerState === 'playing' ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                
                <div className="flex items-center mr-4 group relative">
                  <button
                    id="volume-btn"
                    className="text-white focus:outline-none"
                    onClick={toggleMute}
                  >
                    <span className="material-icons text-2xl">{getVolumeIcon()}</span>
                  </button>
                  <div className="hidden group-hover:block absolute left-8 w-24 h-1 bg-gray-600 rounded-full">
                    <div
                      className="h-full bg-white rounded-full cursor-pointer"
                      style={{ width: `${volume}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const volumeBar = e.currentTarget.parentElement;
                        if (!volumeBar) return;
                        
                        const bounds = volumeBar.getBoundingClientRect();
                        const x = e.clientX - bounds.left;
                        const newVolume = Math.max(0, Math.min(100, Math.round((x / volumeBar.offsetWidth) * 100)));
                        handleVolumeChange(newVolume);
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-white text-sm mr-4">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                {/* Debug Button */}
                <button
                  id="debug-btn"
                  className="text-white mr-4 focus:outline-none"
                  onClick={toggleDebugConsole}
                  title="Show Debug Console"
                >
                  <span className="material-icons text-xl">bug_report</span>
                </button>
                
                {/* Speech Recognition Toggle */}
                {isSTTSupported && (
                  <button
                    id="speech-btn"
                    className={`text-white mr-4 focus:outline-none ${
                      useSpeechRecognition ? 'text-green-400' : ''
                    }`}
                    onClick={toggleSpeechRecognition}
                    title={useSpeechRecognition ? "Disable Speech Recognition" : "Enable Speech Recognition"}
                  >
                    <span className="material-icons text-xl">mic</span>
                    {speechRecStatus === 'fallback' && (
                      <span className="absolute w-2 h-2 bg-yellow-500 rounded-full top-0 right-0"></span>
                    )}
                    {speechRecStatus === 'error' && (
                      <span className="absolute w-2 h-2 bg-red-500 rounded-full top-0 right-0"></span>
                    )}
                  </button>
                )}
                
                {/* Test Fallback Button - Only show in development */}
                {process.env.NODE_ENV === 'development' && useSpeechRecognition && (
                  <button
                    id="test-fallback-btn"
                    className="text-white mr-4 focus:outline-none text-yellow-400"
                    onClick={testFallbackMode}
                    title="Test Fallback Mode"
                  >
                    <span className="material-icons text-xl">warning</span>
                  </button>
                )}
                
                {/* Subtitle Control */}
                <SubtitleControl
                  subtitleTracks={subtitleTracks}
                  selectedTrack={selectedTrack}
                  onTrackChange={onTrackChange}
                />
                
                <button
                  id="fullscreen-btn"
                  className="text-white ml-4 focus:outline-none"
                  onClick={toggleFullscreen}
                >
                  <span className="material-icons text-xl">
                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Console */}
      <DebugConsole
        isOpen={showDebugConsole}
        onClose={() => setShowDebugConsole(false)}
      />
      
      {/* Speech Recognition Status Indicator */}
      {isSTTSupported && useSpeechRecognition && (
        <div className="flex items-center justify-end text-xs px-2 py-1 bg-gray-100">
          <span className="mr-1">Speech Recognition:</span>
          {speechRecStatus === 'active' && (
            <span className="px-1 py-0.5 rounded bg-green-100 text-green-800">Active</span>
          )}
          {speechRecStatus === 'fallback' && (
            <span className="px-1 py-0.5 rounded bg-yellow-100 text-yellow-800">Fallback Mode</span>
          )}
          {speechRecStatus === 'error' && (
            <span className="px-1 py-0.5 rounded bg-red-100 text-red-800">Error</span>
          )}
          {speechRecStatus === 'disabled' && (
            <span className="px-1 py-0.5 rounded bg-gray-200 text-gray-800">Disabled</span>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;