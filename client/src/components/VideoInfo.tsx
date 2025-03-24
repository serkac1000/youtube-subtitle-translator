import React from 'react';
import { VideoDetails } from '../types';

interface VideoInfoProps {
  videoDetails: VideoDetails;
}

const VideoInfo: React.FC<VideoInfoProps> = ({ videoDetails }) => {
  return (
    <div className="w-full max-w-4xl mt-4">
      <h2 className="text-xl font-semibold mb-2">
        {videoDetails.title}
      </h2>
      <div className="flex items-center text-gray-700 mb-4">
        <span className="text-sm mr-3">{videoDetails.viewCount} views</span>
        <span className="text-sm">{videoDetails.uploadDate}</span>
      </div>
      
      <div className="border-t border-b border-gray-200 py-3 flex justify-around">
        <button className="flex flex-col items-center text-gray-700 hover:text-red-600">
          <span className="material-icons">thumb_up</span>
          <span className="text-xs mt-1">Like</span>
        </button>
        <button className="flex flex-col items-center text-gray-700 hover:text-red-600">
          <span className="material-icons">thumb_down</span>
          <span className="text-xs mt-1">Dislike</span>
        </button>
        <button className="flex flex-col items-center text-gray-700 hover:text-red-600">
          <span className="material-icons">share</span>
          <span className="text-xs mt-1">Share</span>
        </button>
        <button className="flex flex-col items-center text-gray-700 hover:text-red-600">
          <span className="material-icons">playlist_add</span>
          <span className="text-xs mt-1">Save</span>
        </button>
        <button className="flex flex-col items-center text-gray-700 hover:text-red-600">
          <span className="material-icons">more_horiz</span>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </div>
  );
};

export default VideoInfo;
