import { SubtitleCue, SubtitleTrack } from "../types";

/**
 * Parse a WebVTT or SRT format subtitle file into a SubtitleTrack
 */
export function parseSubtitles(content: string, language: string, label: string): SubtitleTrack {
  // Detect format based on content
  const isWebVTT = content.trim().startsWith("WEBVTT");
  
  // Clean up line endings for consistent parsing
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Remove WEBVTT header for WebVTT format
  if (isWebVTT) {
    content = content.replace(/^WEBVTT.*?(?:\n{2,})/i, "");
  }
  
  const cues: SubtitleCue[] = [];
  const blocks = content.split(/\n\s*\n/).filter(block => block.trim());
  
  blocks.forEach((block, index) => {
    const lines = block.split("\n").filter(line => line.trim());
    if (lines.length < 2) return; // Skip invalid blocks
    
    let idLine = 0;
    let timeLine = 0;
    
    // Check if the first line is a numeric ID (common in SRT)
    if (/^\d+$/.test(lines[0])) {
      idLine = 0;
      timeLine = 1;
    } else {
      timeLine = 0;
    }
    
    // Check if we have enough lines
    if (timeLine >= lines.length) return;
    
    // Parse timestamp line
    const timeMatch = lines[timeLine].match(/(\d{1,2}:)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}):(\d{2})[,.](\d{3})/);
    if (!timeMatch) return;
    
    // Calculate start and end times in seconds
    const startHours = timeMatch[1] ? parseInt(timeMatch[1]) : 0;
    const startMinutes = parseInt(timeMatch[2]);
    const startSeconds = parseInt(timeMatch[3]);
    const startMs = parseInt(timeMatch[4]);
    
    const endHours = timeMatch[5] ? parseInt(timeMatch[5]) : 0;
    const endMinutes = parseInt(timeMatch[6]);
    const endSeconds = parseInt(timeMatch[7]);
    const endMs = parseInt(timeMatch[8]);
    
    const start = (startHours * 3600) + (startMinutes * 60) + startSeconds + (startMs / 1000);
    const end = (endHours * 3600) + (endMinutes * 60) + endSeconds + (endMs / 1000);
    
    // Join remaining lines as the subtitle text
    const textLines = lines.slice(timeLine + 1);
    let text = textLines.join("\n")
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Handle HTML character entities (both numeric and named)
      .replace(/&#(\d+);/g, (_, charCode) => String.fromCharCode(parseInt(charCode)))
      .replace(/&#x([0-9a-f]+);/gi, (_, charCode) => String.fromCharCode(parseInt(charCode, 16)))
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'");
    
    // Decode URI components if they appear encoded (helps with some Cyrillic issues)
    try {
      // Only try to decode if it actually contains percent encoding
      if (text.includes('%')) {
        const decodedText = decodeURIComponent(text);
        text = decodedText;
      }
    } catch (e) {
      // If decoding fails, keep the original text
      console.warn("Failed to decode subtitle text:", e);
    }
    
    cues.push({
      id: `cue-${index}`,
      start,
      end,
      text
    });
  });
  
  return {
    id: `track-${language}`,
    language,
    label,
    cues
  };
}
