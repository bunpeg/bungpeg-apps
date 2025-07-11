'use client'

import dynamic from 'next/dynamic';
import { tryCatch } from '@bunpeg/helpers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileVideoIcon, PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Loader,
  RenderIf,
  Slider,
  toast,
} from '@bunpeg/ui';
import { useRef, useState } from 'react';
import { useDebounce } from '@bunpeg/ui/hooks';
import type * as dashjs from 'dashjs';

import { env } from '@/env';
import { removeFile } from '@/utils/file-store';
import { type StoredFile, type UserFile, type VideoMeta } from '@/types';

const DynamicDashVideoPlayer = dynamic(() => import('./dash-player'), { ssr: false });

interface Props {
  file: StoredFile;
  onRemove: () => void;
}

interface TrimSegment {
  id: string;
  start: number;
  end: number;
  type: 'keep' | 'delete';
}

export default function Editor(props: Props) {
  const fileId = props.file.id;
  const fileName = props.file.name;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState<TrimSegment[]>([]);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<dashjs.MediaPlayerClass>(null);

  const { data: file, isLoading: isLoadingFileInfo, error: fileError } = useQuery<UserFile>({
    queryKey: ['file', fileId],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files/${fileId}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${fileId} does not exist.`);
      }

      const data = await response.json();
      return data.file;
    },
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { data: metadata, isLoading: isLoadingMeta, error: metaError } = useQuery<VideoMeta>({
    queryKey: ['file', fileId, 'meta'],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/meta/${fileId}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${fileId} does not exist.`);
      }

      const data = await response.json();
      return data.meta;
    },
    enabled: !!file && !file.metadata,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { mutate: deleteFile, isPending: isDeleting } = useMutation<void, Error, string, unknown>({
    mutationFn: async () => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/delete/${fileId}`, { method: 'DELETE' });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to delete the file');
      }
    },
    onSuccess: async () => {
      removeFile('trim', file!.id);
      props.onRemove();
    },
    onError: (err) => {
      toast.error('Failed to delete the file', { description: err.message });
    },
  });

  const togglePlayPause = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Video play/pause error:', error);
        // Reset the playing state if there's an error
        setIsPlaying(false);
      }
    }
  };

  const debounce = useDebounce(300);
  const handleSeek = (value: number[]) => {
    const targetTime = value[0];

    if (
      !videoRef.current ||
      !targetTime ||
      targetTime < 0 ||
      targetTime > duration
    ) {
      return;
    }

    setCurrentTime(targetTime); // Update UI immediately for responsiveness
    debounce.fn(() => void seekNewVideoPosition(targetTime));
  }

  const seekNewVideoPosition = async (targetTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.seek(targetTime);
  };

  const handleTimelineClick = async (e: React.MouseEvent) => {
    // Only handle direct clicks, not drag operations
    if (isDragging || dragStart !== null || dragCurrent !== null) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const targetTime = percentage * duration;

    // Only seek if the click is meaningful (not too close to current position)
    if (Math.abs(targetTime - currentTime) < 0.5) return;

    // Use the improved seek function
    handleSeek([targetTime]);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    setDragStart(time);
    setDragCurrent(time);
    setIsDragging(true);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;
    setDragCurrent(time);
  };

  const handleTimelineMouseUp = (e: React.MouseEvent) => {
    if (dragStart === null || !isDragging) return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    const start = Math.min(dragStart, time);
    const end = Math.max(dragStart, time);

    if (end - start > 0.5) {
      const newSegment: TrimSegment = {
        id: Math.random().toString(36).slice(2, 9),
        start,
        end,
        type: 'delete',
      };
      setSegments((prev) => [...prev, newSegment]);
    }

    // Reset drag state
    setDragStart(null);
    setDragCurrent(null);
    setIsDragging(false);
  };

  const handleTimelineMouseLeave = () => {
    setDragStart(null);
    setDragCurrent(null);
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeSegment = (segmentId: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== segmentId))
  }

  // Timeline and segment marking UI to be implemented
  const meta = metadata ?? file?.metadata ?? null;
  const duration = meta?.duration ? Number(meta.duration) : 0;

  const error = fileError ?? metaError;

  if (isLoadingFileInfo || isLoadingMeta) {
    return (
      <div className="border flex gap-2 p-4">
        <FileVideoIcon className="size-5 mt-1" />
        <div className="flex flex-col gap-1">
          <span>{fileName}</span>
          {error && (
            <span className="text-xs text-red-500">{error.message}</span>
          )}
        </div>
        <RenderIf condition={!error}>
          <Loader size="icon" color="primary" className="ml-auto" />
        </RenderIf>
      </div>
    );
  }

  if (!file) {
    return (
      <span>Failed to load file or video URL</span>
    );
  }

  return (
    <div>
      {/* Uploaded File Info */}
      <div className="border flex gap-2 p-4">
        <FileVideoIcon className="size-5 mt-1" />
        <div className="flex flex-col gap-1">
          <span className="tex-sm">{file.file_name}</span>
          <span className="text-sm text-gray-500">
            ID: {file.id}
            {meta ? (
              <>
                | size: {meta.size / 1024 / 1024} |
                duration: {duration.toFixed(2)} | res:{' '}
                {meta.resolution.width}x{meta.resolution.height}
              </>
            ) : null}
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="ml-auto"
          onClick={() => deleteFile(file.id)}
          disabled={isDeleting}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <DynamicDashVideoPlayer
        playsInline
        ref={videoRef}
        src={buildCdnUrl(fileId)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Video Controls */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayPause}
          className="flex items-center gap-2 bg-transparent w-40"
        >
          {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <span className="text-sm text-gray-500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Timeline Slider */}
      {/* <div className="mb-4">
        <div className="relative">
          <Slider
            onValueChange={handleSeek}
            value={[currentTime]}
            className="w-full"
            max={duration}
            step={0.1}
          />
        </div>
      </div> */}

      {/* Timeline for Segment Selection */}
      <div className="space-y-4">
        <div
          className="relative h-16 bg-gray-200 select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onMouseLeave={handleTimelineMouseLeave}
          onClick={handleTimelineClick}
        >
          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-30 pointer-events-none"
            style={{
              left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />

          {/* Drag preview segment - simplified */}
          {isDragging && dragStart !== null && dragCurrent !== null && duration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-red-200 bg-opacity-70 border-2 border-red-600 border-dashed z-20 pointer-events-none"
              style={{
                left: `${Math.min((Math.min(dragStart, dragCurrent) / duration) * 100, 100)}%`,
                width: `${Math.max(1, (Math.abs(dragCurrent - dragStart) / duration) * 100)}%`,
              }}
            >
              <div className="flex items-center justify-center h-full">
                {Math.abs(dragCurrent - dragStart) > 1 && (
                  <span className="text-xs text-red-900 font-bold px-1 bg-white bg-opacity-90 shadow">
                    {formatTime(Math.abs(dragCurrent - dragStart))}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Existing segments */}
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="absolute cursor-default top-0 bottom-0 bg-red-500 bg-opacity-60 border border-red-600 flex items-center justify-center group z-10"
              style={{
                left: `${duration > 0 ? (segment.start / duration) * 100 : 0}%`,
                width: `${duration > 0 ? ((segment.end - segment.start) / duration) * 100 : 0}%`,
              }}
            >
              <Button
                variant="link"
                size="sm"
                onClick={() => removeSegment(segment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
              >
                <Trash2Icon className="size-4 text-background" />
              </Button>
            </div>
          ))}
        </div>

        {/* Segment List */}
        {segments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">
              Segments to Delete:
            </h4>
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="flex items-center justify-between bg-red-50 p-3 rounded-lg"
              >
                <span className="text-sm">
                  {formatTime(segment.start)} -{' '}
                  {formatTime(segment.end)} (
                  {formatTime(segment.end - segment.start)})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSegment(segment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildCdnUrl(fileId: string) {
  // https://bunpeg.fra1.cdn.digitaloceanspaces.com/uxzpNRlh/dash/manifesto.mpd
  return `https://bunpeg.fra1.cdn.digitaloceanspaces.com/${fileId}/dash/manifesto.mpd`;
}
