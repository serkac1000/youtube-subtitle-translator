// Enhanced speech recognition functionality with robust error handling and retry mechanisms
import { SubtitleCue, SubtitleTrack } from '../types';

// Define a type for the Web Speech API which isn't fully typed in TypeScript by default
interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

// Maximum retry attempts for speech recognition
const MAX_RETRY_ATTEMPTS = 5;

// Base delay for exponential backoff (milliseconds)
const BASE_RETRY_DELAY = 300;

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

// Event callbacks for SpeechToTextService
interface SpeechToTextCallbacks {
  onError?: (error: string, isFatal: boolean) => void;
  onStatusChange?: (status: 'starting' | 'listening' | 'stopped' | 'error') => void;
}

export class SpeechToTextService {
  private recognition: any;
  private isListening: boolean = false;
  private cues: SubtitleCue[] = [];
  private currentCueId: number = 1;
  private startTime: number = 0;
  private language: string;
  private onTranscriptUpdate: (transcript: string, cues: SubtitleCue[]) => void;
  private retryCount: number = 0;
  private retryTimeout: number | null = null;
  private callbacks: SpeechToTextCallbacks;
  private fallbackMode: boolean = false;
  
  constructor(
    options: SpeechToTextOptions = {}, 
    onUpdate: (transcript: string, cues: SubtitleCue[]) => void,
    callbacks: SpeechToTextCallbacks = {}
  ) {
    this.recognition = initSpeechRecognition();
    this.language = options.language || 'ru-RU'; // Default to Russian
    this.onTranscriptUpdate = onUpdate;
    this.callbacks = callbacks;
    
    if (!this.recognition) {
      console.error('Could not initialize speech recognition');
      this.fallbackMode = true;
      this.notifyError('Speech recognition not available', true);
      return;
    }
    
    // Configure the recognition
    this.recognition.lang = this.language;
    this.recognition.continuous = options.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults = options.interimResults !== undefined ? options.interimResults : true;
    
    // Setup event handlers
    this.setupEventListeners();
    
    // Log for debugging
    console.log('Speech recognition service initialized with language:', this.language);
  }
  
  private setupEventListeners() {
    if (!this.recognition) return;
    
    this.recognition.onresult = (event: any) => {
      try {
        // Reset retry count on successful result
        this.retryCount = 0;
        
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        
        console.log(`Speech recognition result: "${transcript}" (${isFinal ? 'final' : 'interim'})`);
        
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
      } catch (error) {
        console.error('Error processing speech recognition result:', error);
        // Don't retry on result processing errors
      }
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, 'Details:', event);
      
      let isFatal = false;
      
      switch (event.error) {
        case 'network':
          this.notifyError('Network error during speech recognition. Check your internet connection.', false);
          // Network errors are often temporary, so retry
          this.scheduleRetry();
          break;
        
        case 'service-not-allowed':
        case 'not-allowed':
          this.notifyError('Speech recognition permission denied. Please allow microphone access.', true);
          isFatal = true;
          break;
          
        case 'aborted':
          // Don't show error for intentional aborts
          console.log('Speech recognition aborted');
          break;
          
        case 'audio-capture':
          this.notifyError('Microphone error. Check that your microphone is properly connected.', true);
          isFatal = true;
          break;
          
        case 'language-not-supported':
          this.notifyError(`Language '${this.language}' is not supported for speech recognition.`, true);
          isFatal = true;
          break;
          
        case 'no-speech':
          console.log('No speech detected, restarting...');
          // For no-speech, just restart without counting as retry
          this.restart();
          break;
          
        default:
          this.notifyError(`Speech recognition error: ${event.error}`, false);
          // For other errors, attempt to retry
          this.scheduleRetry();
      }
      
      // Update status
      this.callbacks.onStatusChange?.('error');
      
      // For fatal errors, switch to fallback mode
      if (isFatal) {
        this.fallbackMode = true;
      }
    };
    
    this.recognition.onend = () => {
      console.log('Speech recognition session ended');
      
      // Don't restart if we manually stopped or reached max retries
      if (this.isListening && !this.fallbackMode && this.retryCount < MAX_RETRY_ATTEMPTS) {
        console.log('Automatically restarting speech recognition');
        this.restart();
      } else if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error('Maximum retry attempts reached, giving up on speech recognition');
        this.notifyError('Speech recognition failed after multiple attempts. Switching to fallback mode.', true);
        this.fallbackMode = true;
        this.isListening = false;
        this.callbacks.onStatusChange?.('stopped');
      }
    };
    
    this.recognition.onstart = () => {
      console.log('Speech recognition started successfully');
      this.callbacks.onStatusChange?.('listening');
    };
  }
  
  private notifyError(message: string, isFatal: boolean) {
    console.error(message);
    this.callbacks.onError?.(message, isFatal);
  }
  
  private scheduleRetry() {
    if (this.retryTimeout) {
      window.clearTimeout(this.retryTimeout);
    }
    
    this.retryCount++;
    
    if (this.retryCount <= MAX_RETRY_ATTEMPTS) {
      // Use exponential backoff for retries
      const delay = BASE_RETRY_DELAY * Math.pow(2, this.retryCount - 1);
      console.log(`Scheduling speech recognition retry ${this.retryCount}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
      
      this.retryTimeout = window.setTimeout(() => {
        if (this.isListening && !this.fallbackMode) {
          console.log(`Retry attempt ${this.retryCount} for speech recognition`);
          this.restart();
        }
      }, delay);
    } else {
      console.error('Maximum retry attempts reached, giving up on speech recognition');
      this.notifyError('Speech recognition failed after multiple attempts. Switching to fallback mode.', true);
      this.fallbackMode = true;
      this.isListening = false;
      this.callbacks.onStatusChange?.('stopped');
    }
  }
  
  start() {
    if (!this.recognition) {
      this.notifyError('Speech recognition not initialized', true);
      return;
    }
    
    // Don't start if already listening
    if (this.isListening) {
      console.log('Speech recognition already active');
      return;
    }
    
    // Don't attempt to start if in fallback mode
    if (this.fallbackMode) {
      console.log('In fallback mode, not starting speech recognition');
      this.notifyError('Speech recognition is not available in this environment', true);
      return;
    }
    
    try {
      this.isListening = true;
      this.startTime = Date.now();
      this.callbacks.onStatusChange?.('starting');
      
      // Add a small delay before starting to avoid rapid restart issues
      setTimeout(() => {
        try {
          this.recognition.start();
          console.log('Speech recognition started');
        } catch (startErr) {
          console.error('Error starting speech recognition with delay:', startErr);
          this.isListening = false;
          this.notifyError('Failed to start speech recognition', false);
          
          // Try to recover with a new instance
          this.recreateAndStart();
        }
      }, 50);
    } catch (err) {
      console.error('Error initiating speech recognition:', err);
      this.isListening = false;
      this.notifyError('Failed to start speech recognition', false);
      
      // Try to recover by creating a new instance
      this.recreateAndStart();
    }
  }
  
  private recreateAndStart() {
    // This is a recovery method to recreate the speech recognition instance
    setTimeout(() => {
      if (this.fallbackMode) return;
      
      console.log('Recreating speech recognition instance');
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
          this.scheduleRetry();
        }
      } else {
        this.notifyError('Failed to recreate speech recognition', true);
        this.fallbackMode = true;
      }
    }, BASE_RETRY_DELAY);
  }
  
  stop() {
    if (!this.recognition) return this.cues;
    
    // Only stop if currently listening
    if (!this.isListening) {
      console.log('Speech recognition already stopped');
      return this.cues;
    }
    
    // Clear any pending retries
    if (this.retryTimeout) {
      window.clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    try {
      this.isListening = false;
      this.recognition.stop();
      console.log('Speech recognition stopped');
      this.callbacks.onStatusChange?.('stopped');
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      // Mark as not listening anyway
      this.isListening = false;
    }
    
    return this.cues;
  }
  
  restart() {
    if (!this.recognition || !this.isListening || this.fallbackMode) return;
    
    try {
      // Set a flag to indicate we're intentionally restarting
      const wasListening = this.isListening;
      this.recognition.stop();
      this.isListening = false; // Mark as not listening during the restart process
      
      // Use a slightly longer timeout to allow complete cleanup
      setTimeout(() => {
        if (this.recognition && wasListening && !this.fallbackMode) { 
          this.isListening = true; // Set back to listening before starting
          try {
            this.recognition.start();
            console.log('Speech recognition restarted');
            this.callbacks.onStatusChange?.('listening');
          } catch (err) {
            console.error('Error restarting speech recognition:', err);
            
            // Try to recover
            this.isListening = false;
            
            try {
              this.recognition.stop();
            } catch (stopErr) {
              // Ignore stop errors during recovery
            }
            
            // Create a new instance as a last resort
            this.recreateAndStart();
          }
        }
      }, 300); // Increased timeout to allow proper cleanup
    } catch (err) {
      console.error('Error stopping speech recognition before restart:', err);
      this.recreateAndStart();
    }
  }
  
  changeLanguage(language: string) {
    if (!this.recognition) return;
    
    console.log(`Changing speech recognition language to: ${language}`);
    this.language = language;
    this.recognition.lang = language;
    
    // Restart recognition with new language
    if (this.isListening && !this.fallbackMode) {
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
  
  isInFallbackMode(): boolean {
    return this.fallbackMode;
  }
  
  clearCues() {
    this.cues = [];
    this.currentCueId = 1;
  }
  
  // Create a fallback subtitle cue for testing or when speech recognition fails
  createFallbackSubtitle(text: string): void {
    const currentTime = (Date.now() - this.startTime) / 1000;
    
    const cue: SubtitleCue = {
      id: `cue-fallback-${this.currentCueId++}`,
      start: currentTime,
      end: currentTime + 5, // Show for 5 seconds
      text: text
    };
    
    this.cues.push(cue);
    this.onTranscriptUpdate(text, this.cues);
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
  try {
    const window = globalThis as unknown as IWindow;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  } catch (error) {
    console.error('Error checking speech recognition support:', error);
    return false;
  }
}

// Helper to check if we're running in a restricted environment like Replit
export function isRestrictedEnvironment(): boolean {
  try {
    // Check for signs that we're in a restricted environment
    // This is a heuristic and might need adjustment
    return (
      // Check for Replit-specific environment variables
      typeof window !== 'undefined' && 
      (
        // @ts-ignore - Check for Replit-specific properties
        !!window.__REPLIT__ || 
        // Check location for replit.com domain
        (window.location && window.location.hostname.includes('replit')) ||
        // Check if we're in an iframe (common for code playgrounds)
        window.self !== window.top
      )
    );
  } catch (error) {
    // If we can't access window.location due to security restrictions,
    // we're probably in a restricted environment
    return true;
  }
}