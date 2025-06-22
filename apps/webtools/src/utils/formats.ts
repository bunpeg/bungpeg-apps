export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/x-matroska',    // .mkv
  'video/quicktime',     // .mov
  'video/x-msvideo',     // .avi
  'video/webm',
  'video/mpeg',   // .mpeg
];

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',          // .mp3
  'audio/mp4',           // .m4a
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/flac',
  'audio/x-wav',
];

export const ALLOWED_MIME_TYPES = [...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES];

export const ALLOWED_VIDEO_FORMATS = [
  'mp4',
  'mkv',
  'webm',
  'mov',
  'avi',
];

export const ALLOWED_AUDIO_FORMATS = [
  'mp3',
  'm4a',
  'aac',
  'flac',
  'wav',
  'opus',
];

export const ALLOWED_FORMATS = [...ALLOWED_AUDIO_FORMATS, ...ALLOWED_VIDEO_FORMATS];
