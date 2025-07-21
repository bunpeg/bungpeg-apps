export interface UserFile {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  metadata?: VideoMeta;
  created_at: string;
}

export type VideoMeta = {
  size: number;
  duration: number | null;
  bitrate: number | null;
  resolution: {
    width: number | null;
    height: number | null;
  };
};

export type FileStore = 'extract-audio' | 'remove-audio' | 'trim' | 'scale' | 'transcode' | 'extract-thumbnail';

export interface StoredFile {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
}
