# YouTube Subtitle Generator

A web application that generates subtitles for YouTube videos using speech-to-text technology. This application allows users to paste YouTube video URLs and get real-time subtitles in both English and Russian languages.

## Features

- Speech recognition subtitle generation in real-time
- Support for multiple languages (focus on English and Russian)
- Proper handling of Cyrillic characters for Russian subtitles
- Fallback to pre-defined subtitles when available
- User-friendly interface with subtitles displayed directly on the video

## Technology Stack

- Frontend: React, Tailwind CSS, shadcn/ui
- Backend: Express.js
- Speech Recognition: Web Speech API
- Video Player: YouTube IFrame API

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser to the displayed URL

## Requirements

- Modern browser with Web Speech API support (Chrome, Edge recommended)
- Internet connection for YouTube video playback

## License

[MIT License](LICENSE)