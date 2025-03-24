import { users, type User, type InsertUser, videos, subtitles, type Video, type Subtitle, type InsertVideo, type InsertSubtitle } from "@shared/schema";
import { russianSubtitleContent, englishSubtitleContent } from "../client/src/data/sampleData";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Video methods
  getVideo(videoId: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  getFeaturedVideos(): Promise<Video[]>;
  
  // Subtitle methods
  getSubtitlesForVideo(videoId: string): Promise<Subtitle[]>;
  getSubtitle(id: number): Promise<Subtitle | undefined>;
  createSubtitle(subtitle: InsertSubtitle): Promise<Subtitle>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<string, Video>;
  private subtitlesDb: Map<number, Subtitle>;
  currentUserId: number;
  currentVideoId: number;
  currentSubtitleId: number;

  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.subtitlesDb = new Map();
    this.currentUserId = 1;
    this.currentVideoId = 1;
    this.currentSubtitleId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Sample video
    const sampleVideo: Video = {
      id: this.currentVideoId++,
      videoId: 'dQw4w9WgXcQ',
      title: 'Sample Video with Russian Subtitles',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      viewCount: 12345,
      uploadDate: 'Oct 15, 2023'
    };
    this.videos.set(sampleVideo.videoId, sampleVideo);
    
    // Sample subtitles
    const russianSubtitle: Subtitle = {
      id: this.currentSubtitleId++,
      videoId: sampleVideo.videoId,
      language: 'ru',
      label: 'Russian',
      content: russianSubtitleContent,
      isDefault: true
    };
    this.subtitlesDb.set(russianSubtitle.id, russianSubtitle);
    
    const englishSubtitle: Subtitle = {
      id: this.currentSubtitleId++,
      videoId: sampleVideo.videoId,
      language: 'en',
      label: 'English',
      content: englishSubtitleContent,
      isDefault: false
    };
    this.subtitlesDb.set(englishSubtitle.id, englishSubtitle);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getVideo(videoId: string): Promise<Video | undefined> {
    return this.videos.get(videoId);
  }
  
  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.currentVideoId++;
    const video: Video = { ...insertVideo, id };
    this.videos.set(video.videoId, video);
    return video;
  }
  
  async getFeaturedVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }
  
  async getSubtitlesForVideo(videoId: string): Promise<Subtitle[]> {
    return Array.from(this.subtitlesDb.values()).filter(
      subtitle => subtitle.videoId === videoId
    );
  }
  
  async getSubtitle(id: number): Promise<Subtitle | undefined> {
    return this.subtitlesDb.get(id);
  }
  
  async createSubtitle(insertSubtitle: InsertSubtitle): Promise<Subtitle> {
    const id = this.currentSubtitleId++;
    const subtitle: Subtitle = { ...insertSubtitle, id };
    this.subtitlesDb.set(id, subtitle);
    return subtitle;
  }
}

export const storage = new MemStorage();
