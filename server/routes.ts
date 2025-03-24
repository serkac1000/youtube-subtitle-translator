import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSubtitlesForVideo, getAlternativeSubtitle, getVideoDetails, getFeaturedVideos } from "./handlers/subtitles";

export async function registerRoutes(app: Express): Promise<Server> {
  // Video API routes
  app.get('/api/videos/featured', getFeaturedVideos);
  app.get('/api/videos/:videoId', getVideoDetails);
  
  // Subtitles API routes
  app.get('/api/subtitles/:videoId', getSubtitlesForVideo);
  app.get('/api/subtitles/:videoId/alternative', getAlternativeSubtitle);

  const httpServer = createServer(app);

  return httpServer;
}
