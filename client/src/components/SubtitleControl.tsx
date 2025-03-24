import React from 'react';
import { SubtitleTrack } from '@/types';

interface SubtitleControlProps {
  subtitleTracks: SubtitleTrack[];
  selectedTrack: SubtitleTrack | null;
  onTrackChange: (track: SubtitleTrack | null) => void;
}

const SubtitleControl: React.FC<SubtitleControlProps> = ({
  subtitleTracks,
  selectedTrack,
  onTrackChange
}) => {
  return (
    <div className="relative group" id="subtitle-control">
      <button
        id="subtitle-btn"
        className={`text-white focus:outline-none ${selectedTrack ? 'bg-red-600' : ''} bg-opacity-70 rounded p-1`}
        aria-label="Subtitles"
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
            onClick={() => onTrackChange(null)}
          >
            <span className="material-icons text-sm mr-2">
              {!selectedTrack ? 'radio_button_checked' : 'radio_button_unchecked'}
            </span>
            <span className="text-sm">Off</span>
          </li>
          
          {subtitleTracks.map(track => (
            <li
              key={track.id}
              className={`flex items-center px-2 py-1 ${
                selectedTrack?.id === track.id ? 'bg-gray-700' : 'hover:bg-gray-700'
              } rounded cursor-pointer`}
              onClick={() => onTrackChange(track)}
            >
              <span className={`material-icons text-sm mr-2 ${selectedTrack?.id === track.id ? 'text-red-500' : ''}`}>
                {selectedTrack?.id === track.id
                  ? 'radio_button_checked'
                  : 'radio_button_unchecked'}
              </span>
              <span className="text-sm">{track.label}</span>
            </li>
          ))}
          
          <li className="flex items-center px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
            <span className="material-icons text-sm mr-2">
              radio_button_unchecked
            </span>
            <span className="text-sm">Auto-translate</span>
          </li>
        </ul>
        
        <div className="mt-2 pt-1 border-t border-gray-700">
          <div className="text-sm text-gray-400 hover:text-white px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
            Options
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtitleControl;
