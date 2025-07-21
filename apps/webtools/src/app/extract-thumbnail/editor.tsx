'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMutation } from '@tanstack/react-query';
import { CpuIcon, FileVideoIcon, Trash2Icon } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, Loader, toast } from '@bunpeg/ui';
import type * as dashjs from 'dashjs';

import { env } from '@/env';
import { type UserFile, type StoredFile } from '@/types';
import { pollFileStatus, buildCdnUrl } from '@/utils/api';
import useFile from '@/utils/hooks/useFile';
import useFileMeta from '@/utils/hooks/useFileMeta';
import { appendFile, markFileAsProcessed } from '@/utils/file-store';

import Wrapper from './wrapper';

const DynamicDashVideoPlayer = dynamic(() => import('../../components/dash-player'), { ssr: false });

interface Props {
  file: StoredFile;
  isDeleting: boolean;
  onRemove: () => void;
  onProcessed: (newFileId: string) => void;
}

export default function Editor(props: Props) {
  const { isDeleting, onRemove, onProcessed } = props;
  const fileId = props.file.id;
  const fileName = props.file.name;

  // const videoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<dashjs.MediaPlayerClass>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const { data: file, isLoading: isLoadingFileInfo, error: fileError } = useFile(fileId);

  const { data: metadata, isLoading: isLoadingMeta, error: metaError } = useFileMeta(fileId, {
    enabled: !!file && !file.metadata,
  });

  const { mutate: extractThumbnail, isPending: isExtracting } = useMutation<string, Error, { time: number; format: string }>({
    mutationFn: async ({ time, format }) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/extract-thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          parent: fileId,
          mode: 'append',
          image_format: format,
          timestamp: time.toString(),
        }),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to extract thumbnail');
      }

      await pollFileStatus(fileId);

      const newFilesRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files?parent=${fileId}`);
      if (!newFilesRes.ok || newFilesRes.status !== 200) {
        throw new Error('Unable to retrieve the thumbnail file');
      }

      const files = (await newFilesRes.json()).files as UserFile[];
      if (files.length === 0) throw new Error('No thumbnail file found');

      const thumbnailFile = files.at(-1)!;
      return thumbnailFile.id;
    },
    onSuccess: (newFileId, { format }) => {
      appendFile('extract-thumbnail', newFileId, `${fileName.split('.')[0]}_thumbnail.${format}`);
      markFileAsProcessed('extract-thumbnail', newFileId);
      onProcessed(newFileId);
    },
    onError: (error) => {
      toast.error('Failed to extract thumbnail', { description: error.message });
    },
  });

  // Video event handlers
  // useEffect(() => {
  //   const video = videoRef.current;
  //   if (!video) return;

  //   const handleLoadedMetadata = () => {
  //     setDuration(video.duration);
  //     setSelectedTime(video.duration / 2); // Default to middle of video
  //   };

  //   const handleTimeUpdate = () => {
  //     setCurrentTime(video.currentTime);
  //   };

  //   const handlePlay = () => setIsPlaying(true);
  //   const handlePause = () => setIsPlaying(false);

  //   video.addEventListener('loadedmetadata', handleLoadedMetadata);
  //   video.addEventListener('timeupdate', handleTimeUpdate);
  //   video.addEventListener('play', handlePlay);
  //   video.addEventListener('pause', handlePause);

  //   return () => {
  //     video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  //     video.removeEventListener('timeupdate', handleTimeUpdate);
  //     video.removeEventListener('play', handlePlay);
  //     video.removeEventListener('pause', handlePause);
  //   };
  // }, []);

  // Generate thumbnail preview when time changes
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.getVideoElement().videoWidth;
    canvas.height = video.getVideoElement().videoHeight;
    ctx.drawImage(video.getVideoElement(), 0, 0);

    const dataUrl = canvas.toDataURL(`image/png`, 0.9);
    setThumbnailPreview(dataUrl);

  }, [currentTime]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      } catch (error) {
        console.error('Video play/pause error:', error);
      }
    }
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with input fields
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  const handleExtract = (format: string) => {
    extractThumbnail({ time: currentTime, format });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const error = fileError ?? metaError;
  const meta = metadata ?? file?.metadata;

  if (isLoadingFileInfo || isLoadingMeta) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <FileVideoIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-muted-foreground">Loading video information...</span>
          </div>
          <Loader size="icon" color="primary" className="ml-auto" />
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <FileVideoIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-red-500">{error.message}</span>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (!file) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <FileVideoIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-red-500">
              Unable to load video file
            </span>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      action={
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isExtracting || !thumbnailPreview}>
              <Button>
                {isExtracting ? (
                  <Loader size="icon" color="white" className="mr-2" />
                ) : (
                  <CpuIcon className="size-4 mr-2" />
                )}
                Process
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Formats</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExtract('jpeg')}>
                  JPEG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExtract('png')}>
                  PNG
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="icon"
            variant="outline"
            onClick={onRemove}
            disabled={isDeleting || isExtracting}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col border">
        {/* File Info */}
        <div className="flex flex-col gap-1 p-4">
          <span>{fileName}</span>
          <span className="text-xs text-muted-foreground">
            {meta?.duration ? `Duration: ${formatTime(Number(meta.duration))}` : ''}
            {meta?.resolution?.width && meta?.resolution?.height
              ? ` | Resolution: ${meta.resolution.width}x${meta.resolution.height}`
              : ''}
            {meta?.size ? ` | Size: ${(meta.size / 1024 / 1024).toFixed(2)}MB` : ''}
          </span>
        </div>

        <div className="h-5 w-full stripped-bg border-t border-b" />

        {/* Video Player */}
        <div className="p-4">
          {/* <div className="relative bg-black overflow-hidden">
            <video
              ref={videoRef}
              src={buildCdnUrl(fileId)}
              className="w-full max-h-96 object-contain"
              muted
              preload="metadata"
            />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
              <Button
                size="icon"
                variant="secondary"
                onClick={handlePlayPause}
                className="w-16 h-16"
              >
                {isPlaying ? (
                  <PauseIcon className="size-8" />
                ) : (
                  <PlayIcon className="size-8" />
                )}
              </Button>
            </div>
          </div> */}

          <DynamicDashVideoPlayer
            controls
            ref={videoRef}
            src={buildCdnUrl(fileId)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
            className="max-h-[calc(100vh_-_200px)]"
          />
        </div>

        {/* Thumbnail Preview */}
        {thumbnailPreview && (
          <>
            <div className="h-5 w-full stripped-bg border-t border-b" />
            <div className="p-4 flex flex-col gap-6">
              <span className="text-sm font-medium">Thumbnail Preview</span>
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="max-w-full h-auto max-h-48 mx-auto"
              />
            </div>
          </>
        )}

        {/* Hidden canvas for thumbnail generation */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </Wrapper>
  );
}
