import React, { useState } from 'react';

interface SettingsControlProps {
  onQualityChange?: (quality: string) => void;
  onPlaybackSpeedChange?: (speed: number) => void;
  onSubtitleSettingsChange?: (settings: SubtitleSettings) => void;
  currentQuality?: string;
  currentSpeed?: number;
}

interface SubtitleSettings {
  fontSize: string;
  fontColor: string;
  backgroundColor: string;
  opacity: number;
}

const SettingsControl: React.FC<SettingsControlProps> = ({
  onQualityChange,
  onPlaybackSpeedChange,
  onSubtitleSettingsChange,
  currentQuality = '1080p',
  currentSpeed = 1
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Available qualities
  const qualities = ['Auto', '1080p', '720p', '480p', '360p', '240p', '144p'];
  
  // Available playback speeds
  const speeds = [
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
    { label: '0.75', value: 0.75 },
    { label: 'Normal', value: 1 },
    { label: '1.25', value: 1.25 },
    { label: '1.5', value: 1.5 },
    { label: '1.75', value: 1.75 },
    { label: '2', value: 2 }
  ];

  // Helper to get current speed label
  const getCurrentSpeedLabel = () => {
    const speedOption = speeds.find(s => s.value === currentSpeed);
    return speedOption ? speedOption.label : 'Normal';
  };

  return (
    <div className="relative group" id="settings-control">
      <button
        id="settings-btn"
        className="text-white focus:outline-none"
        aria-label="Settings"
      >
        <span className="material-icons text-2xl">settings</span>
      </button>
      
      {/* Main Settings Menu */}
      <div className="hidden group-hover:block absolute bottom-10 right-0 bg-controlBg text-white p-2 rounded shadow-lg w-56 z-10">
        {activeMenu === null && (
          <>
            <div className="mb-2">
              <span className="text-sm font-medium">Settings</span>
            </div>
            
            <div className="space-y-2">
              {/* Quality Settings */}
              <div 
                className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => setActiveMenu('quality')}
              >
                <span className="text-sm">Quality</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400">{currentQuality}</span>
                  <span className="material-icons text-sm">chevron_right</span>
                </div>
              </div>
              
              {/* Playback Speed */}
              <div 
                className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => setActiveMenu('speed')}
              >
                <span className="text-sm">Playback Speed</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400">{getCurrentSpeedLabel()}</span>
                  <span className="material-icons text-sm">chevron_right</span>
                </div>
              </div>
              
              {/* Subtitle Settings */}
              <div 
                className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => setActiveMenu('subtitle')}
              >
                <span className="text-sm">Subtitle Settings</span>
                <span className="material-icons text-sm">chevron_right</span>
              </div>
            </div>
          </>
        )}
        
        {/* Quality Submenu */}
        {activeMenu === 'quality' && (
          <>
            <div className="mb-2 flex items-center">
              <span 
                className="material-icons text-sm mr-1 cursor-pointer"
                onClick={() => setActiveMenu(null)}
              >
                arrow_back
              </span>
              <span className="text-sm font-medium">Quality</span>
            </div>
            
            <ul className="space-y-1">
              {qualities.map(quality => (
                <li
                  key={quality}
                  className={`flex items-center px-2 py-1 ${
                    quality === currentQuality ? 'bg-gray-700' : 'hover:bg-gray-700'
                  } rounded cursor-pointer`}
                  onClick={() => {
                    onQualityChange?.(quality);
                    setActiveMenu(null);
                  }}
                >
                  <span className={`material-icons text-sm mr-2 ${
                    quality === currentQuality ? 'text-red-500' : ''
                  }`}>
                    {quality === currentQuality
                      ? 'radio_button_checked'
                      : 'radio_button_unchecked'}
                  </span>
                  <span className="text-sm">{quality}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        
        {/* Playback Speed Submenu */}
        {activeMenu === 'speed' && (
          <>
            <div className="mb-2 flex items-center">
              <span 
                className="material-icons text-sm mr-1 cursor-pointer"
                onClick={() => setActiveMenu(null)}
              >
                arrow_back
              </span>
              <span className="text-sm font-medium">Playback Speed</span>
            </div>
            
            <ul className="space-y-1">
              {speeds.map(speed => (
                <li
                  key={speed.label}
                  className={`flex items-center px-2 py-1 ${
                    speed.value === currentSpeed ? 'bg-gray-700' : 'hover:bg-gray-700'
                  } rounded cursor-pointer`}
                  onClick={() => {
                    onPlaybackSpeedChange?.(speed.value);
                    setActiveMenu(null);
                  }}
                >
                  <span className={`material-icons text-sm mr-2 ${
                    speed.value === currentSpeed ? 'text-red-500' : ''
                  }`}>
                    {speed.value === currentSpeed
                      ? 'radio_button_checked'
                      : 'radio_button_unchecked'}
                  </span>
                  <span className="text-sm">{speed.label}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        
        {/* Subtitle Settings Submenu */}
        {activeMenu === 'subtitle' && (
          <>
            <div className="mb-2 flex items-center">
              <span 
                className="material-icons text-sm mr-1 cursor-pointer"
                onClick={() => setActiveMenu(null)}
              >
                arrow_back
              </span>
              <span className="text-sm font-medium">Subtitle Settings</span>
            </div>
            
            <div className="space-y-3 px-2">
              <div>
                <div className="text-xs mb-1">Font Size</div>
                <select 
                  className="w-full bg-gray-800 text-white text-sm p-1 rounded"
                  onChange={(e) => {
                    onSubtitleSettingsChange?.({
                      fontSize: e.target.value,
                      fontColor: 'white',
                      backgroundColor: 'black',
                      opacity: 0.7
                    });
                  }}
                >
                  <option value="12px">Small</option>
                  <option value="16px" selected>Medium</option>
                  <option value="20px">Large</option>
                </select>
              </div>
              
              <div>
                <div className="text-xs mb-1">Background Opacity</div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="70" 
                  className="w-full"
                  onChange={(e) => {
                    onSubtitleSettingsChange?.({
                      fontSize: '16px',
                      fontColor: 'white',
                      backgroundColor: 'black',
                      opacity: parseInt(e.target.value) / 100
                    });
                  }}
                />
              </div>
              
              <div className="pt-2 text-center">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                  onClick={() => setActiveMenu(null)}
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsControl;
