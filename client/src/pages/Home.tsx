import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpeechToTextService, isSpeechRecognitionSupported } from '../services/SpeechToTextService';
import VideoPlayer from '../components/video/VideoPlayer';
import ControlPanel from '../components/controls/ControlPanel';
import DebugConsole from '../components/debug/DebugConsole';
import DebugLogger from '../components/debug/DebugLogger';
import { RecognitionStatus, SubtitleCue } from '@shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('ru-RU');
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('inactive');
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [activeTab, setActiveTab] = useState('debug');
  
  const speechToTextRef = useRef<SpeechToTextService | null>(null);
  const logger = DebugLogger.getInstance();
  
  // Initialize speech recognition service
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      logger.log('Speech recognition is not supported in this browser', 'error');
      setIsSupported(false);
      return;
    }
    
    // Initialize the speech-to-text service
    try {
      logger.log('Initializing SpeechToTextService', 'info');
      speechToTextRef.current = new SpeechToTextService(
        { language: currentLanguage, continuous: true, interimResults: true },
        (transcript, cues) => {
          setCurrentSubtitle(transcript);
          setSubtitleCues(cues);
        },
        logger
      );
      logger.log('SpeechToTextService initialized successfully', 'success');
    } catch (error) {
      logger.log('Failed to initialize SpeechToTextService', 'error', error);
      setIsSupported(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (speechToTextRef.current) {
        logger.log('Stopping speech recognition service', 'info');
        speechToTextRef.current.stop();
      }
    };
  }, []);
  
  // Handle starting speech recognition
  const handleStartRecognition = () => {
    if (!speechToTextRef.current) {
      logger.log('Cannot start - Speech recognition service not initialized', 'error');
      return;
    }
    
    logger.log('Starting speech recognition', 'info');
    speechToTextRef.current.start();
    setRecognitionStatus('listening');
  };
  
  // Handle stopping speech recognition
  const handleStopRecognition = () => {
    if (!speechToTextRef.current) {
      logger.log('Cannot stop - Speech recognition service not initialized', 'error');
      return;
    }
    
    logger.log('Stopping speech recognition', 'info');
    speechToTextRef.current.stop();
    setRecognitionStatus('inactive');
  };
  
  // Handle restarting speech recognition
  const handleRestartRecognition = () => {
    if (!speechToTextRef.current) {
      logger.log('Cannot restart - Speech recognition service not initialized', 'error');
      return;
    }
    
    logger.log('Restarting speech recognition', 'warning');
    setRecognitionStatus('restarting');
    
    speechToTextRef.current.restart();
    
    // Set status back to listening after a delay (to show restarting state)
    setTimeout(() => {
      if (speechToTextRef.current?.getStatus().isListening) {
        setRecognitionStatus('listening');
      }
    }, 1500);
  };
  
  // Handle language change
  const handleLanguageChange = (language: string) => {
    if (!speechToTextRef.current) {
      logger.log('Cannot change language - Speech recognition service not initialized', 'error');
      return;
    }
    
    logger.log(`Changing recognition language to: ${language}`, 'info');
    setCurrentLanguage(language);
    speechToTextRef.current.changeLanguage(language);
  };
  
  // Get current recognition status details
  const getRecognitionStatusDetails = () => {
    if (!speechToTextRef.current) return { isListening: false, language: currentLanguage, cuesCount: 0 };
    return speechToTextRef.current.getStatus();
  };

  // If speech recognition is not supported, show an error message
  if (!isSupported) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
        <Card className="w-full max-w-md mx-4 bg-gray-800 text-white border-gray-700">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold">Speech Recognition Not Supported</h1>
            </div>
            <p className="mt-4 text-sm text-gray-300">
              Your browser does not support the Web Speech API required for subtitle generation.
              Please use a modern browser like Chrome, Edge, or Safari.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background-dark text-gray-100 flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="material-icons text-primary-light">subtitles</span>
          <h1 className="text-xl font-semibold">YouTube Subtitle Translator - Debug Console</h1>
        </div>
        <div>
          <a 
            href="https://github.com/serkac1000/youtube-subtitle-translator" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1 bg-primary text-white rounded flex items-center hover:bg-primary-dark transition"
          >
            <span className="material-icons text-sm mr-1">help_outline</span>
            <span>Help</span>
          </a>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video player */}
        <VideoPlayer 
          youtubeUrl={youtubeUrl} 
          subtitle={currentSubtitle}
          onVideoLoad={() => {
            logger.log('YouTube video loaded successfully', 'success');
            // Auto-start speech recognition when video is loaded
            if (recognitionStatus === 'inactive') {
              handleStartRecognition();
            }
          }} 
        />
        
        {/* Control panel */}
        <ControlPanel 
          youtubeUrl={youtubeUrl}
          onYoutubeUrlChange={setYoutubeUrl}
          onPlayVideo={() => logger.log('Playing video', 'info')}
          recognitionStatus={recognitionStatus}
          language={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onStartRecognition={handleStartRecognition}
          onStopRecognition={handleStopRecognition}
          onRestartRecognition={handleRestartRecognition}
        />
        
        {/* Tabs panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs 
            defaultValue="debug" 
            className="w-full h-full" 
            value={activeTab} 
            onValueChange={setActiveTab}
          >
            <div className="bg-gray-900 flex border-b border-gray-700">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger 
                  value="debug"
                  className={`px-6 py-3 border-b-2 ${
                    activeTab === 'debug' ? 'border-primary-light' : 'border-transparent'
                  } flex items-center text-sm`}
                >
                  <span className="material-icons text-sm mr-2">bug_report</span>
                  <span>Debug Console</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="editor"
                  className={`px-6 py-3 border-b-2 ${
                    activeTab === 'editor' ? 'border-primary-light' : 'border-transparent'
                  } flex items-center text-sm`}
                >
                  <span className="material-icons text-sm mr-2">subtitles</span>
                  <span>Subtitle Editor</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className={`px-6 py-3 border-b-2 ${
                    activeTab === 'settings' ? 'border-primary-light' : 'border-transparent'
                  } flex items-center text-sm`}
                >
                  <span className="material-icons text-sm mr-2">settings</span>
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="debug" className="flex-1 overflow-hidden mt-0 p-0">
              <DebugConsole recognitionStatus={getRecognitionStatusDetails()} />
            </TabsContent>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden mt-0 p-0">
              <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
                <div className="text-center">
                  <span className="material-icons text-4xl mb-2">subtitles</span>
                  <p>Subtitle Editor - Coming Soon</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 overflow-hidden mt-0 p-0">
              <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
                <div className="text-center">
                  <span className="material-icons text-4xl mb-2">settings</span>
                  <p>Settings - Coming Soon</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-2 px-4 text-center text-gray-400 text-sm">
        <p>YouTube Subtitle Translator Debug Console - v0.2.1</p>
      </footer>
    </div>
  );
}
