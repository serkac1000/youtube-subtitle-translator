// Speech recognition functionality to generate subtitles from audio
import { SubtitleCue, SubtitleTrack } from '@shared/types';

// Define a type for the Web Speech API which isn't fully typed in TypeScript by default
interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

// Logger interface for debug logs
export interface Logger {
  log(message: string, type?: string, data?: any): void;
}

// Initialize the speech recognition with the appropriate API
const initSpeechRecognition = () => {
  try {
    // First check if the browser is in a context that supports speech recognition
    // This helps with sandboxed environments like iframes
    if (typeof navigator === 'undefined' || 
        !navigator || 
        !navigator.mediaDevices || 
        typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error('Browser environment does not support media devices needed for speech recognition');
      return null;
    }
    
    const browserWindow = globalThis as unknown as IWindow;
    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return null;
    }
    
    // Create new instance and immediately verify it works
    const instance = new SpeechRecognition();
    
    // Test that the instance has the expected properties and methods
    if (!instance || 
        typeof instance.start !== 'function' || 
        typeof instance.stop !== 'function') {
      console.error('Speech recognition instance is not valid');
      return null;
    }
    
    console.log('Speech recognition instance created successfully:', true);
    return instance;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    return null;
  }
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
  private logger: Logger | null = null;
  private recognitionRestartAttempts: number = 0;
  private maxRestartAttempts: number = 5;
  private restartTimeout: number | null = null;
  private lastRecognitionTimestamp: number = 0;
  
  constructor(
    options: SpeechToTextOptions = {}, 
    onUpdate: (transcript: string, cues: SubtitleCue[]) => void,
    logger?: Logger
  ) {
    this.language = options.language || 'ru-RU'; // Default to Russian
    this.onTranscriptUpdate = onUpdate;
    this.logger = logger || null;
    
    this.log('Initializing speech recognition service', 'info');
    this.recognition = initSpeechRecognition();
    
    if (!this.recognition) {
      this.log('Could not initialize speech recognition - browser may not support it', 'error');
      return;
    }
    
    // Configure the recognition
    this.recognition.lang = this.language;
    this.recognition.continuous = options.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults = options.interimResults !== undefined ? options.interimResults : true;
    this.log(`Speech recognition object initialized with language: ${this.language}`, 'info');
    
    // Setup event handlers
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    if (!this.recognition) {
      this.log('Cannot setup event listeners - recognition object is null', 'error');
      return;
    }
    
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      
      if (isFinal) {
        // Create a new subtitle cue
        const endTime = (Date.now() - this.startTime) / 1000;
        const startTime = Math.max(0, endTime - (transcript.length * 0.08)); // Rough estimation for start time
        
        const cue: SubtitleCue = {
          id: `cue-${this.currentCueId++}`,
          start: startTime,
          end: endTime,
          text: transcript.trim()
        };
        
        this.cues.push(cue);
        this.log(`Final transcript received: "${transcript}"`, 'success');
        this.log(`DEBUG: Created subtitle cue id=${cue.id}, start=${startTime.toFixed(3)}, end=${endTime.toFixed(3)}`, 'debug');
        this.onTranscriptUpdate(transcript, this.cues);
        this.lastRecognitionTimestamp = Date.now();
      } else {
        // Update with interim result
        this.log(`Interim transcript received: "${transcript}"`, 'debug');
        this.onTranscriptUpdate(transcript, this.cues);
        this.lastRecognitionTimestamp = Date.now();
      }
    };
    
    this.recognition.onerror = (event: any) => {
      this.log(`Speech recognition error: ${event.error}`, 'error', event);
      if (event.error === 'no-speech') {
        // Restart if no speech was detected
        this.log('No speech detected, restarting recognition', 'warning');
        this.restart();
      } else if (event.error === 'network') {
        this.log('Network error in speech recognition, attempting to recover', 'error');
        this.forceRestart();
      } else if (event.error === 'aborted') {
        this.log('Speech recognition aborted', 'warning');
      } else {
        this.log(`Unhandled speech recognition error: ${event.error}`, 'error');
        this.forceRestart();
      }
    };
    
    this.recognition.onend = () => {
      // Check if it ended unexpectedly
      if (this.isListening) {
        this.log('Speech recognition ended unexpectedly', 'error');
        this.log('Restarting speech recognition due to unexpected end...', 'warning');
        this.forceRestart();
      } else {
        this.log('Speech recognition ended normally', 'info');
      }
    };
    
    this.recognition.onstart = () => {
      this.log('Speech recognition started and listening', 'info');
      this.recognitionRestartAttempts = 0; // Reset restart attempts on successful start
      this.lastRecognitionTimestamp = Date.now();
    };
  }
  
  // Regular logging function
  private log(message: string, type: 'info' | 'error' | 'warning' | 'debug' | 'success' = 'info', data?: any) {
    console.log(`[SpeechToText] ${message}`);
    if (this.logger) {
      this.logger.log(message, type, data);
    }
  }
  
  start() {
    if (!this.recognition) {
      this.log('Cannot start - speech recognition not supported', 'error');
      // Try to recreate the recognition instance
      this.recognition = initSpeechRecognition();
      if (!this.recognition) {
        this.log('Still cannot initialize speech recognition', 'error');
        return;
      }
      this.log('Successfully recreated speech recognition instance', 'success');
      // Configure the recreated instance
      this.recognition.lang = this.language;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.setupEventListeners();
    }
    
    // Only start if not already listening to prevent errors
    if (this.isListening) {
      this.log('Speech recognition already active', 'warning');
      return;
    }
    
    try {
      this.log('Attempting to start speech recognition...', 'info');
      this.isListening = true;
      this.startTime = Date.now();
      this.recognition.start();
      this.log('Speech recognition started successfully', 'success');
      this.setupHealthCheck();
    } catch (err) {
      this.log('Error starting speech recognition:', 'error', err);
      this.isListening = false;
      
      // Try to recover by creating a new instance
      this.log('Attempting to recreate speech recognition instance after error...', 'warning');
      setTimeout(() => {
        try {
          this.recognition = initSpeechRecognition();
          if (this.recognition) {
            this.recognition.lang = this.language;
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.setupEventListeners();
            
            this.log('Trying to start with new instance...', 'info');
            this.isListening = true;
            this.startTime = Date.now();
            this.recognition.start();
            this.log('Speech recognition recreated and started successfully', 'success');
            this.setupHealthCheck();
          } else {
            this.log('Failed to recreate speech recognition instance', 'error');
          }
        } catch (startErr) {
          this.log('Failed to start recreated speech recognition:', 'error', startErr);
          this.isListening = false;
        }
      }, 1000);
    }
  }
  
  stop() {
    if (!this.recognition) {
      this.log('Cannot stop - speech recognition not supported', 'error');
      return this.cues;
    }
    
    // Only stop if currently listening
    if (!this.isListening) {
      this.log('Speech recognition already stopped', 'warning');
      return this.cues;
    }
    
    try {
      this.isListening = false;
      this.recognition.stop();
      this.log('Speech recognition stopped', 'info');
      this.clearHealthCheck();
    } catch (err) {
      this.log('Error stopping speech recognition:', 'error', err);
      // Mark as not listening anyway
      this.isListening = false;
    }
    
    return this.cues;
  }
  
  restart() {
    if (!this.recognition || !this.isListening) {
      this.log('Cannot restart - recognition not initialized or not listening', 'warning');
      return;
    }
    
    this.log('Restarting speech recognition...', 'warning');
    
    try {
      this.isListening = false;
      this.recognition.stop();
      
      // Reset the restart timeout if it exists
      if (this.restartTimeout !== null) {
        clearTimeout(this.restartTimeout);
      }
      
      // Use a timeout to ensure the instance has time to close
      this.restartTimeout = window.setTimeout(() => {
        if (this.recognition) {
          this.log('DEBUG: Restoring recognition state, isListening=true', 'debug');
          this.isListening = true;
          try {
            this.startTime = Date.now();
            this.recognition.start();
            this.log('Speech recognition restarted', 'info');
            this.restartTimeout = null;
            this.setupHealthCheck();
          } catch (err) {
            this.log('Error restarting speech recognition:', 'error', err);
            this.forceRestart();
          }
        }
      }, 1000);
    } catch (err) {
      this.log('Error stopping speech recognition before restart:', 'error', err);
      this.forceRestart();
    }
  }
  
  forceRestart() {
    this.recognitionRestartAttempts++;
    
    if (this.recognitionRestartAttempts > this.maxRestartAttempts) {
      this.log('Exceeded maximum restart attempts. Please refresh the page.', 'error');
      this.isListening = false;
      return;
    }
    
    this.log(`Force restarting speech recognition (attempt ${this.recognitionRestartAttempts}/${this.maxRestartAttempts})`, 'warning');
    
    // Clean up existing recognition instance
    if (this.recognition) {
      try {
        this.isListening = false;
        this.recognition.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    
    // Create a completely new instance
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
          this.log('Speech recognition recreated and started', 'success');
          this.setupHealthCheck();
        } catch (err) {
          this.log('Failed to start new speech recognition instance:', 'error', err);
          this.isListening = false;
          
          // Try one more time after a longer delay
          setTimeout(() => this.forceRestart(), 2000);
        }
      } else {
        this.log('Failed to create a new speech recognition instance', 'error');
      }
    }, 1000);
  }
  
  // Setup a health check to make sure recognition is working
  private setupHealthCheck() {
    // Check every 10 seconds if we've received any recognition events
    const healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRecognition = now - this.lastRecognitionTimestamp;
      
      // If more than 30 seconds with no recognition events, restart
      if (this.isListening && timeSinceLastRecognition > 30000) {
        this.log(`No recognition events for ${Math.floor(timeSinceLastRecognition/1000)} seconds, restarting`, 'warning');
        this.forceRestart();
      }
    }, 10000);
    
    // Store the interval ID so we can clear it later
    (this as any).healthCheckInterval = healthCheckInterval;
  }
  
  private clearHealthCheck() {
    if ((this as any).healthCheckInterval) {
      clearInterval((this as any).healthCheckInterval);
      (this as any).healthCheckInterval = null;
    }
  }
  
  changeLanguage(language: string) {
    if (!this.recognition) return;
    
    this.log(`Changing speech recognition language to: ${language}`, 'info');
    this.language = language;
    this.recognition.lang = language;
    
    // Restart recognition with new language
    if (this.isListening) {
      this.restart();
    }
  }
  
  getCurrentSubtitleTrack(): SubtitleTrack {
    this.log(`Current cues count: ${this.cues.length}`, 'info');
    return {
      id: `track-speech-${this.language}`,
      language: this.language.split('-')[0], // Extract primary language code
      label: this.getLanguageLabel(this.language) + ' (Speech)',
      cues: this.cues,
      isDefault: true
    };
  }
  
  clearCues() {
    this.log('Clearing all subtitle cues', 'info');
    this.cues = [];
    this.currentCueId = 1;
  }
  
  getStatus(): { isListening: boolean; language: string; cuesCount: number } {
    return {
      isListening: this.isListening,
      language: this.language,
      cuesCount: this.cues.length
    };
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
