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
    
    // Only start if not already listening to prevent errors
    if (this.isListening) {
      console.log('Speech recognition already active');
      return;
    }
    
    try {
      this.isListening = true;
      this.startTime = Date.now();
      this.recognition.start();
      console.log('Speech recognition started');
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      this.isListening = false;
      
      // Try to recover by creating a new instance
      setTimeout(() => {
        this.recognition = initSpeechRecognition();
        if (this.recognition) {
          this.recognition.lang = this.language;
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.setupEventListeners();
          
          try {
            this.isListening = true;
            this.startTime = Date.now();
            this.recognition.start();
            console.log('Speech recognition recreated and started');
          } catch (startErr) {
            console.error('Failed to start recreated speech recognition:', startErr);
            this.isListening = false;
          }
        }
      }, 500);
    }
  }
  
  stop() {
    if (!this.recognition) return;
    
    // Only stop if currently listening
    if (!this.isListening) {
      console.log('Speech recognition already stopped');
      return this.cues;
    }
    
    try {
      this.isListening = false;
      this.recognition.stop();
      console.log('Speech recognition stopped');
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      // Mark as not listening anyway
      this.isListening = false;
    }
    
    return this.cues;
  }
  
  restart() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
      this.isListening = false; // Mark as not listening during the restart process
      
      setTimeout(() => {
        if (this.recognition) { // Check again in case it was cleared during the timeout
          this.isListening = true; // Set back to listening before starting
          try {
            this.recognition.start();
            console.log('Speech recognition restarted');
          } catch (err) {
            console.error('Error restarting speech recognition:', err);
            // Try to recover
            this.isListening = false;
            this.recognition.stop();
            
            // Create a new instance as a last resort
            this.recognition = initSpeechRecognition();
            if (this.recognition) {
              this.recognition.lang = this.language;
              this.recognition.continuous = true;
              this.recognition.interimResults = true;
              this.setupEventListeners();
              this.isListening = true;
              this.recognition.start();
              console.log('Speech recognition recreated and started');
            }
          }
        }
      }, 500); // Increased timeout to allow proper cleanup
    } catch (err) {
      console.error('Error stopping speech recognition before restart:', err);
    }
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
      id: `track-speech-${this.language}`,
      language: this.language.split('-')[0], // Extract primary language code
      label: this.getLanguageLabel(this.language) + ' (Speech)',
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

const MAX_RETRIES = 3;
const BACKOFF_DELAY = 1000;

export class SpeechRecognitionService {
  private recognition: any;
  private retryCount: number = 0;
  private isInFallbackMode: boolean = false;

  constructor() {
    const window = globalThis as unknown as IWindow;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onerror = (event: any) => {
      console.warn("Speech recognition error", event.error);
      if (["network", "aborted"].includes(event.error) && this.retryCount < MAX_RETRIES) {
        this.retryWithBackoff();
      } else {
        this.enableFallbackMode();
      }
    };
  }

  private retryWithBackoff() {
    this.retryCount++;
    setTimeout(() => {
      if (!this.isInFallbackMode) {
        this.start();
      }
    }, BACKOFF_DELAY * this.retryCount);
  }

  private enableFallbackMode() {
    this.isInFallbackMode = true;
    // Implement fallback subtitle display logic here
  }

  public start() {
    if (this.recognition && !this.isInFallbackMode) {
      try {
        this.recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        this.enableFallbackMode();
      }
    }
  }

  public stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export function isSpeechRecognitionSupported(): boolean {
  const window = globalThis as unknown as IWindow;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}