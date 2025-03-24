import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  videoId: text("videoId").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  viewCount: integer("viewCount").default(0),
  uploadDate: text("uploadDate"),
});

export const subtitles = pgTable("subtitles", {
  id: serial("id").primaryKey(),
  videoId: text("videoId").notNull(),
  language: text("language").notNull(),
  label: text("label").notNull(),
  content: text("content").notNull(),
  isDefault: boolean("isDefault").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  videoId: true,
  thumbnailUrl: true,
  uploadDate: true,
});

export const insertSubtitleSchema = createInsertSchema(subtitles).pick({
  videoId: true,
  language: true,
  label: true,
  content: true,
  isDefault: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Subtitle = typeof subtitles.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertSubtitle = z.infer<typeof insertSubtitleSchema>;
