# YouTube Subtitle Translator

A web application that uses speech recognition to generate real-time subtitles for YouTube videos, with support for multiple languages.

## Features

- Real-time subtitle generation using browser's Speech Recognition API
- YouTube video playback integration
- Multiple language support for speech recognition
- Fallback subtitle mode when speech recognition fails
- Debug console for monitoring recognition status and errors
- Network error recovery with automatic retry mechanism
- Responsive design that works on different screen sizes

## Technology Stack

- React + TypeScript
- Tailwind CSS with Shadcn UI components
- Express.js backend
- Speech Recognition Web API

## Setup & Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Troubleshooting

### Speech Recognition Issues

The Web Speech API requires:
- A secure context (HTTPS or localhost)
- Browser permissions for microphone access
- Network connectivity to Google's speech recognition services

In some environments (like Replit), the app may encounter network restrictions. The app includes:
- Automatic retries with exponential backoff
- Fallback mode that displays predefined subtitles when recognition consistently fails

## License

MIT