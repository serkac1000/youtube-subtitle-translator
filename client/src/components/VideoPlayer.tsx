import React, { useState, useRef, useEffect } from 'react';
import { SubtitleTrack, SubtitleCue, PlayerState } from '../types';
import { formatTime } from '../lib/timeUtils';
import { SpeechToTextService, isSpeechRecognitionSupported } from '../lib/speechRecognition';

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
  
  // Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<number | null>(null);
  const speechToTextService = useRef<SpeechToTextService | null>(null);
  
  // Check if speech recognition is supported
  useEffect(() => {
    setIsSTTSupported(isSpeechRecognitionSupported());
  }, []);
  
  // Initialize speech recognition service
  useEffect(() => {
    if (!isSTTSupported) return;
    
    // Initialize the speech-to-text service
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
      }
    );
    
    return () => {
      // Cleanup speech recognition
      if (speechToTextService.current) {
        speechToTextService.current.stop();
      }
    };
  }, [isSTTSupported, currentLanguage]);
  
  // Handle speech recognition based on player state
  useEffect(() => {
    if (!speechToTextService.current || !isSTTSupported || !useSpeechRecognition) return;
    
    if (playerState === 'playing' && !speechToTextEnabled) {
      setSpeechToTextEnabled(true);
      speechToTextService.current.start();
      
      // Create a new subtitle track for speech recognition
      const speechTrack: SubtitleTrack = speechToTextService.current.getCurrentSubtitleTrack();
      onTrackChange(speechTrack);
      
    } else if (playerState !== 'playing' && speechToTextEnabled) {
      setSpeechToTextEnabled(false);
      speechToTextService.current.stop();
    }
  }, [playerState, useSpeechRecognition]);
  
  // Change speech recognition language
  const changeSpeechRecognitionLanguage = (language: string) => {
    if (!speechToTextService.current) return;
    
    setCurrentLanguage(language);
    speechToTextService.current.changeLanguage(language);
    
    // Update the track
    if (speechToTextEnabled) {
      const updatedTrack = speechToTextService.current.getCurrentSubtitleTrack();
      onTrackChange(updatedTrack);
    }
  };
  
  // Load YouTube API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    window.onYouTubeIframeAPIReady = initializePlayer;
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    return () => {
      window.onYouTubeIframeAPIReady = null;
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    };
  }, [videoId]);
  
  // Initialize player once YouTube API is loaded
  const initializePlayer = () => {
    if (!playerRef.current) return;
    
    const ytPlayer = new YT.Player(playerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
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
        onStateChange: onPlayerStateChange
      }
    });
    
    setPlayer(ytPlayer);
  };
  
  // Player ready event handler
  const onPlayerReady = (event: YT.PlayerEvent) => {
    setDuration(event.target.getDuration());
    startProgressTracking();
  };
  
  // Player state change event handler
  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        setPlayerState('playing');
        break;
      case YT.PlayerState.PAUSED:
        setPlayerState('paused');
        break;
      case YT.PlayerState.ENDED:
        setPlayerState('ended');
        break;
      case YT.PlayerState.BUFFERING:
        setPlayerState('buffering');
        break;
      case YT.PlayerState.CUED:
        setPlayerState('cued');
        break;
      default:
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
    if (!selectedTrack || speechToTextEnabled) {
      return;
    }
    
    const activeCue = selectedTrack.cues.find(
      cue => time >= cue.start && time <= cue.end
    );
    
    setCurrentSubtitle(activeCue ? activeCue.text : '');
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
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!isSTTSupported) return;
    
    setUseSpeechRecognition(!useSpeechRecognition);
    
    if (!useSpeechRecognition) {
      // Starting speech recognition
      if (playerState === 'playing' && speechToTextService.current) {
        setSpeechToTextEnabled(true);
        speechToTextService.current.start();
        
        // Create a new subtitle track for speech recognition
        const speechTrack = speechToTextService.current.getCurrentSubtitleTrack();
        onTrackChange(speechTrack);
      }
    } else {
      // Stopping speech recognition
      if (speechToTextService.current) {
        setSpeechToTextEnabled(false);
        speechToTextService.current.stop();
        
        // Clear the current subtitle
        setCurrentSubtitle('');
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
                className={`inline-block bg-black bg-opacity-60 text-white px-3 py-1 rounded text-lg max-w-lg mx-auto ${speechToTextEnabled ? 'border border-red-500' : ''}`}
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
                        const percent = Math.min(Math.max((x / volumeBar.offsetWidth) * 100, 0), 100);
                        handleVolumeChange(percent);
                      }}
                    ></div>
                  </div>
                </div>
                
                <span className="text-white text-sm" id="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className="flex items-center">
                {/* Speech-to-Text Button (new) */}
                {isSTTSupported && (
                  <div className="relative mr-4" id="speech-recognition-control">
                    <button
                      id="speech-recognition-btn"
                      className={`text-white focus:outline-none ${speechToTextEnabled ? 'bg-red-600' : ''} bg-opacity-70 rounded p-1`}
                      onClick={toggleSpeechRecognition}
                      title={speechToTextEnabled ? "Disable speech recognition" : "Enable speech recognition"}
                    >
                      <span className="material-icons text-xl">mic</span>
                    </button>
                  </div>
                )}
                
                {/* Subtitles Control Component */}
                <div className="relative mr-4 group" id="subtitle-control">
                  <button
                    id="subtitle-btn"
                    className={`text-white focus:outline-none ${selectedTrack ? 'bg-red-600' : ''} bg-opacity-70 rounded p-1`}
                  >
                    <span className="material-icons text-xl">subtitles</span>
                  </button>
                  
                  {/* Subtitles Menu */}
                  <div className="hidden group-hover:block absolute bottom-10 right-0 bg-controlBg text-white p-2 rounded shadow-lg w-48 z-10">
                    <div className="mb-2 border-b border-gray-700 pb-1">
                      <span className="text-sm font-medium">Subtitles/CC</span>
                    </div>
                    <ul className="space-y-1">
                      <li
                        className="flex items-center px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => {
                          onTrackChange(null);
                          setUseSpeechRecognition(false);
                          setSpeechToTextEnabled(false);
                          if (speechToTextService.current) {
                            speechToTextService.current.stop();
                          }
                        }}
                      >
                        <span className="material-icons text-sm mr-2">
                          {!selectedTrack ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <span className="text-sm">Off</span>
                      </li>
                      
                      {/* Speech-to-Text options */}
                      {isSTTSupported && (
                        <>
                          <li className="px-2 py-1 border-t border-gray-700 mt-1 mb-1">
                            <span className="text-xs text-gray-400">Speech Recognition</span>
                          </li>
                          <li
                            className={`flex items-center px-2 py-1 ${
                              speechToTextEnabled && currentLanguage === 'ru-RU' ? 'bg-gray-700' : 'hover:bg-gray-700'
                            } rounded cursor-pointer`}
                            onClick={() => {
                              setUseSpeechRecognition(true);
                              changeSpeechRecognitionLanguage('ru-RU');
                              if (playerState === 'playing') {
                                setSpeechToTextEnabled(true);
                                if (speechToTextService.current) {
                                  speechToTextService.current.start();
                                  const track = speechToTextService.current.getCurrentSubtitleTrack();
                                  onTrackChange(track);
                                }
                              }
                            }}
                          >
                            <span className={`material-icons text-sm mr-2 ${
                              speechToTextEnabled && currentLanguage === 'ru-RU' ? 'text-red-500' : ''
                            }`}>
                              {speechToTextEnabled && currentLanguage === 'ru-RU'
                                ? 'radio_button_checked'
                                : 'radio_button_unchecked'}
                            </span>
                            <span className="text-sm">Russian (Speech)</span>
                          </li>
                          <li
                            className={`flex items-center px-2 py-1 ${
                              speechToTextEnabled && currentLanguage === 'en-US' ? 'bg-gray-700' : 'hover:bg-gray-700'
                            } rounded cursor-pointer`}
                            onClick={() => {
                              setUseSpeechRecognition(true);
                              changeSpeechRecognitionLanguage('en-US');
                              if (playerState === 'playing') {
                                setSpeechToTextEnabled(true);
                                if (speechToTextService.current) {
                                  speechToTextService.current.start();
                                  const track = speechToTextService.current.getCurrentSubtitleTrack();
                                  onTrackChange(track);
                                }
                              }
                            }}
                          >
                            <span className={`material-icons text-sm mr-2 ${
                              speechToTextEnabled && currentLanguage === 'en-US' ? 'text-red-500' : ''
                            }`}>
                              {speechToTextEnabled && currentLanguage === 'en-US'
                                ? 'radio_button_checked'
                                : 'radio_button_unchecked'}
                            </span>
                            <span className="text-sm">English (Speech)</span>
                          </li>
                        </>
                      )}
                      
                      {/* Regular subtitle tracks */}
                      {subtitleTracks.length > 0 && (
                        <li className="px-2 py-1 border-t border-gray-700 mt-1 mb-1">
                          <span className="text-xs text-gray-400">Loaded Subtitles</span>
                        </li>
                      )}
                      
                      {subtitleTracks.map(track => (
                        <li
                          key={track.id}
                          className={`flex items-center px-2 py-1 ${
                            selectedTrack?.id === track.id && !speechToTextEnabled ? 'bg-gray-700' : 'hover:bg-gray-700'
                          } rounded cursor-pointer`}
                          onClick={() => {
                            onTrackChange(track);
                            setUseSpeechRecognition(false);
                            setSpeechToTextEnabled(false);
                            if (speechToTextService.current) {
                              speechToTextService.current.stop();
                            }
                          }}
                        >
                          <span className={`material-icons text-sm mr-2 ${
                            selectedTrack?.id === track.id && !speechToTextEnabled ? 'text-red-500' : ''
                          }`}>
                            {selectedTrack?.id === track.id && !speechToTextEnabled
                              ? 'radio_button_checked'
                              : 'radio_button_unchecked'}
                          </span>
                          <span className="text-sm">{track.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Settings Button */}
                <div className="relative mr-4 group" id="settings-control">
                  <button
                    id="settings-btn"
                    className="text-white focus:outline-none"
                  >
                    <span className="material-icons text-2xl">settings</span>
                  </button>
                  
                  {/* Settings Menu */}
                  <div className="hidden group-hover:block absolute bottom-10 right-0 bg-controlBg text-white p-2 rounded shadow-lg w-56 z-10">
                    <div className="mb-2">
                      <span className="text-sm font-medium">Settings</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Quality Settings */}
                      <div className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                        <span className="text-sm">Quality</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">1080p</span>
                          <span className="material-icons text-sm">chevron_right</span>
                        </div>
                      </div>
                      
                      {/* Playback Speed */}
                      <div className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                        <span className="text-sm">Playback Speed</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">Normal</span>
                          <span className="material-icons text-sm">chevron_right</span>
                        </div>
                      </div>
                      
                      {/* Subtitle Settings */}
                      <div className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                        <span className="text-sm">Subtitle Settings</span>
                        <span className="material-icons text-sm">chevron_right</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Fullscreen Button */}
                <button
                  id="fullscreen-btn"
                  className="text-white focus:outline-none"
                  onClick={toggleFullscreen}
                >
                  <span className="material-icons text-2xl">
                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
