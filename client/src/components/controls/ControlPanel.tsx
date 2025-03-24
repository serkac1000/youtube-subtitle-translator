import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecognitionStatus } from '@shared/types';
import DebugLogger from '../debug/DebugLogger';

interface ControlPanelProps {
  youtubeUrl: string;
  onYoutubeUrlChange: (url: string) => void;
  onPlayVideo: () => void;
  recognitionStatus: RecognitionStatus;
  language: string;
  onLanguageChange: (language: string) => void;
  onStartRecognition: () => void;
  onStopRecognition: () => void;
  onRestartRecognition: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  youtubeUrl,
  onYoutubeUrlChange,
  onPlayVideo,
  recognitionStatus,
  language,
  onLanguageChange,
  onStartRecognition,
  onStopRecognition,
  onRestartRecognition
}) => {
  const [url, setUrl] = useState(youtubeUrl);
  const logger = DebugLogger.getInstance();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleClearUrl = () => {
    setUrl('');
    onYoutubeUrlChange('');
  };

  const handleSubmitUrl = () => {
    onYoutubeUrlChange(url);
    onPlayVideo();
    logger.log(`Loading YouTube video: ${url}`, 'info');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitUrl();
    }
  };

  const handleLanguageChange = (value: string) => {
    onLanguageChange(value);
    logger.log(`Changed speech recognition language to: ${value}`, 'info');
  };

  return (
    <div className="bg-gray-800 border-t border-b border-gray-700 p-4">
      <div className="flex flex-wrap gap-4">
        {/* URL Input */}
        <div className="flex-1 min-w-[300px]">
          <div className="flex">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Enter YouTube URL"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-l text-white focus:outline-none focus:ring-1 focus:ring-primary-light"
                value={url}
                onChange={handleUrlChange}
                onKeyDown={handleKeyDown}
              />
              {url && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={handleClearUrl}
                >
                  <span className="material-icons text-sm">clear</span>
                </button>
              )}
            </div>
            <Button 
              className="bg-primary px-4 py-2 rounded-r text-white hover:bg-primary-dark transition"
              onClick={handleSubmitUrl}
            >
              <span className="material-icons text-sm">play_arrow</span>
            </Button>
          </div>
        </div>
        
        {/* Language Selection */}
        <div className="flex space-x-2 items-center">
          <label className="whitespace-nowrap">Speech Language:</label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-gray-900 border border-gray-700 rounded w-[160px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border border-gray-700">
              <SelectItem value="ru-RU">Russian</SelectItem>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="fr-FR">French</SelectItem>
              <SelectItem value="de-DE">German</SelectItem>
              <SelectItem value="es-ES">Spanish</SelectItem>
              <SelectItem value="it-IT">Italian</SelectItem>
              <SelectItem value="zh-CN">Chinese</SelectItem>
              <SelectItem value="ja-JP">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Speech Recognition Controls */}
        <div className="flex items-center space-x-3">
          {/* Status indicator */}
          <div className="flex items-center space-x-2 border border-gray-700 rounded px-3 py-1.5 bg-gray-900">
            <div className={`speech-wave h-5 ${recognitionStatus === 'listening' ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span 
              className={
                recognitionStatus === 'listening' ? 'text-green-400' :
                recognitionStatus === 'error' ? 'text-red-400' :
                recognitionStatus === 'restarting' ? 'text-yellow-400' :
                'text-gray-400'
              }
            >
              {recognitionStatus === 'listening' ? 'Listening' :
               recognitionStatus === 'restarting' ? 'Restarting...' :
               recognitionStatus === 'error' ? 'Error' :
               'Not Listening'}
            </span>
          </div>
          
          {/* Start button */}
          <Button 
            className="bg-success px-3 py-2 rounded text-white hover:bg-green-600 transition flex items-center"
            onClick={onStartRecognition}
            disabled={recognitionStatus === 'listening'}
          >
            <span className="material-icons text-sm mr-1">mic</span>
            <span>Start</span>
          </Button>
          
          {/* Stop button */}
          <Button 
            className="bg-error px-3 py-2 rounded text-white hover:bg-red-700 transition flex items-center"
            onClick={onStopRecognition}
            disabled={recognitionStatus === 'inactive'}
          >
            <span className="material-icons text-sm mr-1">mic_off</span>
            <span>Stop</span>
          </Button>
          
          {/* Restart button */}
          <Button 
            className="bg-warning px-3 py-2 rounded text-white hover:bg-orange-700 transition flex items-center"
            onClick={onRestartRecognition}
            disabled={recognitionStatus === 'inactive'}
          >
            <span className="material-icons text-sm mr-1">refresh</span>
            <span>Restart</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
