import { SubtitleTrack, VideoDetails } from "../types";

// Sample Russian subtitle content
export const russianSubtitleContent = `WEBVTT

1
00:00:02.500 --> 00:00:05.000
Здравствуйте, добро пожаловать!

2
00:00:05.500 --> 00:00:09.000
Это пример русских субтитров.

3
00:00:10.000 --> 00:00:14.000
Теперь они работают правильно.

4
00:00:15.000 --> 00:00:18.000
Кодировка UTF-8 поддерживается.

5
00:00:20.000 --> 00:00:24.000
Все символы отображаются корректно.

6
00:00:26.000 --> 00:00:30.000
Это фиксированная версия плеера.`;

// Sample English subtitle content
export const englishSubtitleContent = `WEBVTT

1
00:00:02.500 --> 00:00:05.000
Hello, welcome!

2
00:00:05.500 --> 00:00:09.000
This is an example of English subtitles.

3
00:00:10.000 --> 00:00:14.000
Now they are working correctly.

4
00:00:15.000 --> 00:00:18.000
UTF-8 encoding is supported.

5
00:00:20.000 --> 00:00:24.000
All characters display correctly.

6
00:00:26.000 --> 00:00:30.000
This is the fixed version of the player.`;

// Sample video details
export const sampleVideoDetails: VideoDetails = {
  videoId: 'dQw4w9WgXcQ', // Sample YouTube video ID
  title: 'Sample Video with Russian Subtitles',
  viewCount: '12,345',
  uploadDate: 'Oct 15, 2023'
};
