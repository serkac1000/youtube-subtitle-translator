import { Request, Response } from 'express';
import { storage } from '../storage';
import { russianSubtitleContent, englishSubtitleContent } from '../../client/src/data/sampleData';

// Helper to send sample data when database is not available
const getSampleSubtitles = (videoId: string) => {
  return [
    {
      id: 1,
      videoId,
      language: 'ru',
      label: 'Russian',
      content: russianSubtitleContent,
      isDefault: true
    },
    {
      id: 2,
      videoId,
      language: 'en',
      label: 'English',
      content: englishSubtitleContent,
      isDefault: false
    }
  ];
};

export const getSubtitlesForVideo = async (req: Request, res: Response) => {
  const { videoId } = req.params;

  try {
    // Try to get subtitles from database
    const subtitles = await storage.getSubtitlesForVideo(videoId);
    
    // If no subtitles found, return sample data
    if (!subtitles || subtitles.length === 0) {
      return res.json(getSampleSubtitles(videoId));
    }
    
    return res.json(subtitles);
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    // Fallback to sample data in case of error
    return res.json(getSampleSubtitles(videoId));
  }
};

export const getAlternativeSubtitle = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  
  // Sample alternative subtitle with a different format/style
  const alternativeSubtitle = {
    id: 3,
    videoId,
    language: 'ru-alt',
    label: 'Russian (Alternative)',
    content: russianSubtitleContent.replace('WEBVTT', 'WEBVTT - Alternative Format'),
    isDefault: false
  };
  
  return res.json(alternativeSubtitle);
};

export const getVideoDetails = async (req: Request, res: Response) => {
  const { videoId } = req.params;
  
  try {
    // Try to get video details from database
    const video = await storage.getVideo(videoId);
    
    if (video) {
      return res.json(video);
    }
    
    // Fallback sample video data
    return res.json({
      videoId,
      title: 'Sample Video with Russian Subtitles',
      viewCount: '12,345',
      uploadDate: 'Oct 15, 2023'
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    // Fallback sample video data
    return res.json({
      videoId,
      title: 'Sample Video with Russian Subtitles',
      viewCount: '12,345',
      uploadDate: 'Oct 15, 2023'
    });
  }
};

export const getFeaturedVideos = async (_req: Request, res: Response) => {
  try {
    // Try to get featured videos from database
    const videos = await storage.getFeaturedVideos();
    
    if (videos && videos.length > 0) {
      return res.json(videos[0]);
    }
    
    // Fallback to sample data
    return res.json({
      videoId: 'dQw4w9WgXcQ',
      title: 'Sample Video with Russian Subtitles',
      viewCount: '12,345',
      uploadDate: 'Oct 15, 2023',
      subtitles: getSampleSubtitles('dQw4w9WgXcQ')
    });
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    // Fallback to sample data
    return res.json({
      videoId: 'dQw4w9WgXcQ',
      title: 'Sample Video with Russian Subtitles',
      viewCount: '12,345',
      uploadDate: 'Oct 15, 2023',
      subtitles: getSampleSubtitles('dQw4w9WgXcQ')
    });
  }
};
