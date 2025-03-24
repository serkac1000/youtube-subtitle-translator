# YouTube Subtitle Translator

A web application that uses speech recognition to generate real-time subtitles for YouTube videos in multiple languages.

## Features

- Load any YouTube video by URL or video ID
- Real-time speech-to-text conversion for subtitle generation
- Support for multiple languages (primarily Russian and English)
- Customizable video player with controls
- Toggle between speech recognition and pre-loaded subtitles
- Clean, responsive UI

## Technology Stack

- React for the frontend UI
- Web Speech API for real-time speech recognition
- YouTube Embedded Player API for video playback
- Express backend for serving API endpoints
- TypeScript for type safety

## How It Works

This application uses the browser's built-in Web Speech API to analyze the audio from YouTube videos and convert speech to text in real-time. The generated text is then displayed as subtitles synchronized with the video playback.

The application doesn't rely on pre-existing subtitle files or YouTube's closed captioning, making it work with virtually any YouTube video, even those without official subtitles.

## Usage

1. Enter a YouTube URL or video ID in the input field
2. Click the "Load Video" button
3. Use the microphone button to toggle speech recognition
4. Select different languages for the speech recognition

## Setup and Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## License

MIT