// Speech recognition functionality to generate subtitles from audio
import { SubtitleCue, SubtitleTrack } from '../types';

// Define a type for the Web Speech API which isn't fully typed in TypeScript by default
interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

// Initialize the speech recognition with the appropriate API
const initSpeechRecognition = () => {
  const window = globalThis as unknown as IWindow;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }
  
  return new SpeechRecognition();
};

interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class SpeechToTextService {
  private recognition: any;
  private isListening: boolean = false;
  private cues: SubtitleCue[] = [];
  private currentCueId: number = 1;
  private startTime: number = 0;
  private language: string;
  private onTranscriptUpdate: (transcript: string, cues: SubtitleCue[]) => void;
  
  constructor(options: SpeechToTextOptions = {}, onUpdate: (transcript: string, cues: SubtitleCue[]) => void) {
    this.recognition = initSpeechRecognition();
    this.language = options.language || 'ru-RU'; // Default to Russian
    this.onTranscriptUpdate = onUpdate;
    
    if (!this.recognition) {
      console.error('Could not initialize speech recognition');
      return;
    }
    
    // Configure the recognition
    this.recognition.lang = this.language;
    this.recognition.continuous = options.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults = options.interimResults !== undefined ? options.interimResults : true;
    
    // Setup event handlers
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    if (!this.recognition) return;
    
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      if (isFinal) {
        // Create a new subtitle cue
        const endTime = (Date.now() - this.startTime) / 1000;
        const startTime = endTime - (transcript.length * 0.08); // Rough estimation for start time
        
        const cue: SubtitleCue = {
          id: `cue-${this.currentCueId++}`,
          start: startTime,
          end: endTime,
          text: transcript.trim()
        };
        
        this.cues.push(cue);
        this.onTranscriptUpdate(transcript, this.cues);
      } else {
        // Update with interim result
        this.onTranscriptUpdate(transcript, this.cues);
      }
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'no-speech') {
        // Restart if no speech was detected
        this.restart();
      }
    };
    
    this.recognition.onend = () => {
      // Restart if still listening
      if (this.isListening) {
        this.restart();
      }
    };
  }
  
  start() {
    if (!this.recognition) return;
    
    this.isListening = true;
    this.startTime = Date.now();
    this.recognition.start();
    console.log('Speech recognition started');
  }
  
  stop() {
    if (!this.recognition) return;
    
    this.isListening = false;
    this.recognition.stop();
    console.log('Speech recognition stopped');
    
    return this.cues;
  }
  
  restart() {
    if (!this.recognition || !this.isListening) return;
    
    this.recognition.stop();
    setTimeout(() => {
      if (this.isListening) {
        this.recognition.start();
      }
    }, 300);
  }
  
  changeLanguage(language: string) {
    if (!this.recognition) return;
    
    this.language = language;
    this.recognition.lang = language;
    
    // Restart recognition with new language
    if (this.isListening) {
      this.restart();
    }
  }
  
  getCurrentSubtitleTrack(): SubtitleTrack {
    return {
      id: `track-${this.language}`,
      language: this.language.split('-')[0], // Extract primary language code
      label: this.getLanguageLabel(this.language),
      cues: this.cues,
      isDefault: true
    };
  }
  
  clearCues() {
    this.cues = [];
    this.currentCueId = 1;
  }
  
  private getLanguageLabel(langCode: string): string {
    const languages: Record<string, string> = {
      'ru-RU': 'Russian',
      'en-US': 'English',
      'en-GB': 'English (UK)',
      'fr-FR': 'French',
      'de-DE': 'German',
      'es-ES': 'Spanish',
      'it-IT': 'Italian',
      'zh-CN': 'Chinese',
      'ja-JP': 'Japanese'
    };
    
    return languages[langCode] || langCode;
  }
}

// Helper function to check if speech recognition is supported in this browser
export function isSpeechRecognitionSupported(): boolean {
  const window = globalThis as unknown as IWindow;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}