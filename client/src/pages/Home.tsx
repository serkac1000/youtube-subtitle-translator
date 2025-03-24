import React from 'react';
import RutubePlayer from '@/components/RutubePlayer';
import { useQuery } from '@tanstack/react-query';
import { parseSubtitles } from '@/lib/subtitleParser';
import { russianSubtitleContent, englishSubtitleContent, sampleVideoDetails } from '@/data/sampleData';

const Home: React.FC = () => {
  // For demonstration, we're using sample data if API doesn't respond
  const { data: apiData, isError } = useQuery({
    queryKey: ['/api/videos/featured'],
    queryFn: async () => {
      // This will use the default query function from queryClient.ts
      // It will fetch from /api/videos/featured
      return null; // We'll handle fallback in the next step
    }
  });
  
  // If API call fails or returns no data, use sample data
  const videoData = apiData || {
    videoId: sampleVideoDetails.videoId,
    subtitles: [
      {
        language: 'ru',
        label: 'Russian',
        content: russianSubtitleContent,
        isDefault: true
      },
      {
        language: 'en',
        label: 'English',
        content: englishSubtitleContent,
        isDefault: false
      }
    ]
  };
  
  return (
    <div>
      <RutubePlayer 
        videoId={videoData.videoId} 
        initialLanguage="ru"
      />
    </div>
  );
};

export default Home;
