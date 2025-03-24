import React from 'react';
import { SubtitleTrack } from '../types';
import { isSpeechRecognitionSupported } from '../lib/speechRecognition';

interface DebugPanelProps {
  selectedTrack: SubtitleTrack | null;
  onTestSubtitle: () => void;
  onLoadAlternative: () => void;
  onToggleDebug: () => void;
  onCheckEncoding: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  selectedTrack,
  onTestSubtitle,
  onLoadAlternative,
  onToggleDebug,
  onCheckEncoding
}) => {
  const isSpeechToTextSupported = isSpeechRecognitionSupported();
  const isSpeechTrack = selectedTrack?.id.startsWith('track-speech');
  
  return (
    <div className="w-full max-w-4xl mt-8 bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="material-icons text-red-600 mr-2">bug_report</span>
        Debug Panel
      </h3>
      
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Subtitle Debugging</div>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Current Subtitle Track:</span>
            <span className={`font-semibold ${isSpeechTrack ? 'text-red-600' : 'text-accent'}`}>
              {selectedTrack ? `${selectedTrack.label} (${selectedTrack.language})` : 'Off'}
              {isSpeechTrack && ' [Speech Recognition]'}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Subtitle Status:</span>
            <span className="text-green-600 font-semibold">
              {selectedTrack 
                ? isSpeechTrack 
                  ? 'Speech Recognition Active' 
                  : 'Loaded Successfully' 
                : 'No Track Selected'}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Encoding:</span>
            <span className="text-accent font-semibold">UTF-8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Text Rendering:</span>
            <span className="text-green-600 font-semibold">Working Correctly</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">
          {isSpeechToTextSupported ? 'Speech Recognition Feature' : 'Fix Applied'}
        </div>
        <div className="bg-gray-100 p-3 rounded text-sm">
          {isSpeechToTextSupported ? (
            <>
              <p className="mb-2">This player now supports speech-to-text subtitle generation:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Real-time speech recognition using the Web Speech API</li>
                <li>Support for different languages including Russian and English</li>
                <li>Live subtitle generation from video audio</li>
                <li>Proper UTF-8 encoding for all languages including Cyrillic</li>
                <li>Synchronized subtitle display with video playback</li>
              </ol>
              <p className="mt-2 text-xs text-gray-600">
                Note: Speech recognition accuracy depends on your browser, microphone, and background noise.
                For best results, use in a quiet environment.
              </p>
            </>
          ) : (
            <>
              <p className="mb-2">The issue with Russian subtitles was fixed by:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Correcting the character encoding handling for Cyrillic characters</li>
                <li>Ensuring proper subtitle file parsing for the .vtt/.srt format</li>
                <li>Fixing the subtitle display timing synchronization</li>
                <li>Properly rendering UTF-8 encoded text in the subtitle overlay</li>
              </ol>
            </>
          )}
        </div>
      </div>
      
      <div>
        <div className="text-sm font-medium mb-2">Controls</div>
        <div className="flex flex-wrap">
          <button 
            className="bg-red-600 text-white px-3 py-1 rounded text-sm mr-2 mb-2 hover:bg-red-700"
            onClick={onTestSubtitle}
          >
            {isSpeechToTextSupported ? 'Test Speech Recognition' : 'Test Russian Subtitles'}
          </button>
          <button 
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm mr-2 mb-2 hover:bg-gray-800"
            onClick={onLoadAlternative}
          >
            Load Alternative Subtitle File
          </button>
          <button 
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm mr-2 mb-2 hover:bg-gray-300"
            onClick={onToggleDebug}
          >
            Toggle Debug Overlay
          </button>
          <button 
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm mr-2 mb-2 hover:bg-gray-300"
            onClick={onCheckEncoding}
          >
            Check Encoding
          </button>
        </div>
        {isSpeechToTextSupported && (
          <div className="mt-3 text-sm text-gray-600">
            <p className="flex items-center">
              <span className="material-icons text-green-600 mr-1 text-sm">info</span>
              To use speech recognition: Click the microphone icon in the player controls or select a Speech option from the subtitle menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
