'use client'

import dynamic from 'next/dynamic';
import { tryCatch } from '@bunpeg/helpers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileVideoIcon, Trash2Icon } from 'lucide-react';
import {
  Button,
  Loader,
  RenderIf,
  toast,
} from '@bunpeg/ui';
import { useRef, useState, useEffect, useCallback } from 'react';
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

interface DragState {
  type: 'create' | 'resize-start' | 'resize-end' | null;
  segmentId?: string;
  startTime?: number;
  currentTime?: number;
}

const TIMELINE_CONFIG = {
  MIN_SEGMENT_DURATION: 1,
  SNAP_TOLERANCE: 0.5,
  GRID_INTERVAL: 1, // 1 second intervals
  HANDLE_WIDTH: 8,
} as const;

export default function Editor(props: Props) {
  const fileId = props.file.id;
  const fileName = props.file.name;

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [segments, setSegments] = useState<TrimSegment[]>([]);
  const [dragState, setDragState] = useState<DragState>({ type: null });
  const [previewSegment, setPreviewSegment] = useState<{ start: number; end: number } | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const videoRef = useRef<dashjs.MediaPlayerClass>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  // Timeline and segment marking UI to be implemented
  const meta = metadata ?? file?.metadata ?? null;
  const duration = meta?.duration ? Number(meta.duration) : 0;

  const snapToGrid = useCallback((time: number) => {
    const gridSize = TIMELINE_CONFIG.GRID_INTERVAL;
    const snapped = Math.round(time / gridSize) * gridSize;
    return Math.abs(snapped - time) < TIMELINE_CONFIG.SNAP_TOLERANCE ? snapped : time;
  }, []);

  const updateSegmentStart = useCallback((segmentId: string, newStart: number) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        const clampedStart = Math.max(0, Math.min(newStart, segment.end - TIMELINE_CONFIG.MIN_SEGMENT_DURATION));
        return { ...segment, start: clampedStart };
      }
      return segment;
    }));
  }, []);

  const updateSegmentEnd = useCallback((segmentId: string, newEnd: number) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        const clampedEnd = Math.min(duration, Math.max(newEnd, segment.start + TIMELINE_CONFIG.MIN_SEGMENT_DURATION));
        return { ...segment, end: clampedEnd };
      }
      return segment;
    }));
  }, [duration]);

  // Global mouse event handling for better drag behavior
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState.type === null || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const currentTime = snapToGrid(percentage * duration);

      if (dragState.type === 'create' && dragState.startTime !== undefined) {
        const start = Math.min(dragState.startTime, currentTime);
        const end = Math.max(dragState.startTime, currentTime);
        setPreviewSegment({ start, end });
      } else if (dragState.type === 'resize-start' && dragState.segmentId) {
        updateSegmentStart(dragState.segmentId, currentTime);
      } else if (dragState.type === 'resize-end' && dragState.segmentId) {
        updateSegmentEnd(dragState.segmentId, currentTime);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragState.type === 'create' && previewSegment) {
        const segmentDuration = previewSegment.end - previewSegment.start;
        if (segmentDuration >= TIMELINE_CONFIG.MIN_SEGMENT_DURATION) {
          const newSegment: TrimSegment = {
            id: Math.random().toString(36).slice(2, 9),
            start: previewSegment.start,
            end: previewSegment.end,
            type: 'delete',
          };
          setSegments(prev => [...prev, newSegment]);
        }
      }

      setDragState({ type: null });
      setPreviewSegment(null);
    };

    if (dragState.type !== null) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, previewSegment, duration, snapToGrid, updateSegmentStart, updateSegmentEnd]);

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

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Delete':
        case 'Backspace':
          if (hoveredSegment) {
            e.preventDefault();
            removeSegment(hoveredSegment);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredSegment, togglePlayPause]);

  const getTimelinePosition = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (dragState.type !== null) return;

    e.preventDefault();
    e.stopPropagation();

    const targetTime = snapToGrid(getTimelinePosition(e.clientX));

    if (videoRef.current && Math.abs(targetTime - currentTime) > 0.1) {
      videoRef.current.seek(targetTime);
      setCurrentTime(targetTime);
    }
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const time = getTimelinePosition(e.clientX);
    const snappedTime = snapToGrid(time);

    setDragState({
      type: 'create',
      startTime: snappedTime,
      currentTime: snappedTime,
    });

    setPreviewSegment({ start: snappedTime, end: snappedTime });
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    // Mouse move is now handled by global event listener
    e.preventDefault();
  };

  const handleTimelineMouseUp = () => {
    // Mouse up is now handled by global event listener
  };

  const handleSegmentResizeStart = (segmentId: string, edge: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      type: edge === 'start' ? 'resize-start' : 'resize-end',
      segmentId,
    });
  };

  const handleTimelineMouseLeave = () => {
    if (dragState.type === 'create') {
      setDragState({ type: null });
      setPreviewSegment(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeSegment = (segmentId: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== segmentId))
  }

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
                | size: {(meta.size / 1024 / 1024).toFixed(2)}MB |
                duration: {duration.toFixed(2)}s | res:{' '}
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
        controls
        ref={videoRef}
        src={buildCdnUrl(fileId)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Timeline for Segment Selection */}
      <div className="relative overflow-hidden mt-2">
        <div
          ref={timelineRef}
          className="relative h-20 bg-gray-200 select-none border-2 border-gray-100 overflow-hidden"
          style={{
            cursor: dragState.type === 'create'
              ? 'crosshair'
              : dragState.type === 'resize-start' || dragState.type === 'resize-end'
                ? 'col-resize'
                : 'pointer',
          }}
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onMouseLeave={handleTimelineMouseLeave}
          onClick={handleTimelineClick}
          role="slider"
          aria-label="Video timeline"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          {/* Grid markers */}
          {Array.from({ length: Math.ceil(duration / TIMELINE_CONFIG.GRID_INTERVAL) + 1 }, (_, i) => {
            const time = i * TIMELINE_CONFIG.GRID_INTERVAL;
            if (time > duration) return null;
            const isMainMarker = i % 5 === 0;
            return (
              <div
                key={i}
                className={`absolute top-0 bottom-0 w-px ${isMainMarker ? 'bg-gray-600 opacity-50' : 'bg-gray-400 opacity-20'}`}
                style={{
                  left: `${duration > 0 ? (time / duration) * 100 : 0}%`,
                }}
              >
                {isMainMarker && (
                  <div className="absolute -top-5 left-0 text-xs text-gray-600 font-medium transform -translate-x-1/2 bg-white px-1 rounded shadow-sm">
                    {formatTime(time)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary z-40 pointer-events-none shadow-lg"
            style={{
              left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary rotate-45"></div>
          </div>

          {/* Preview segment during creation */}
          {previewSegment && duration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-red-200 bg-opacity-70 border-2 border-red-600 border-dashed z-30 pointer-events-none"
              style={{
                left: `${(previewSegment.start / duration) * 100}%`,
                width: `${Math.max(0.5, ((previewSegment.end - previewSegment.start) / duration) * 100)}%`,
              }}
            >
              <div className="flex items-center justify-center h-full">
                {previewSegment.end - previewSegment.start > 1 && (
                  <span className="text-xs text-red-900 font-bold px-1 bg-white bg-opacity-90 shadow rounded">
                    {formatTime(previewSegment.end - previewSegment.start)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Existing segments */}
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="absolute top-0 bottom-0 bg-red-500 bg-opacity-60 border border-red-600 flex items-center justify-center group/segment z-20"
              style={{
                left: `${duration > 0 ? (segment.start / duration) * 100 : 0}%`,
                width: `${duration > 0 ? Math.max(1, ((segment.end - segment.start) / duration) * 100) : 0}%`,
              }}
              onMouseEnter={() => setHoveredSegment(segment.id)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              {/* Start resize handle */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 bg-red-700 cursor-w-resize opacity-0 group-hover/segment:opacity-100 hover:bg-red-800 hover:w-3 transition-all z-30 flex items-center justify-center"
                onMouseDown={handleSegmentResizeStart(segment.id, 'start')}
                title="Drag to adjust start time"
              >
                <div className="w-px h-4 bg-white opacity-80"></div>
              </div>

              {/* End resize handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-2 bg-red-700 cursor-e-resize opacity-0 group-hover/segment:opacity-100 hover:bg-red-800 hover:w-3 transition-all z-30 flex items-center justify-center"
                onMouseDown={handleSegmentResizeStart(segment.id, 'end')}
                title="Drag to adjust end time"
              >
                <div className="w-px h-4 bg-white opacity-80"></div>
              </div>

              {/* Segment content */}
              <div className="flex items-center justify-center px-2 cursor-pointer group/content border-background" title={`Delete segment: ${formatTime(segment.start)} - ${formatTime(segment.end)}`}>
                <span className="text-xs text-white font-medium group-hover/content:hidden transition-opacity mr-2">
                  {formatTime(segment.end - segment.start)}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSegment(segment.id);
                  }}
                  className="hidden group-hover/content:flex transition-opacity p-1 h-auto hover:bg-red-800"
                  title="Delete segment"
                >
                  <Trash2Icon className="size-3 text-white drop-shadow-sm" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segment List */}
      {/* {segments.length > 0 && (
        <div className="space-y-2 px-4 mt-4">
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
      )} */}
    </div>
  );
}

function buildCdnUrl(fileId: string) {
  // https://bunpeg.fra1.cdn.digitaloceanspaces.com/uxzpNRlh/dash/manifesto.mpd
  return `https://bunpeg.fra1.cdn.digitaloceanspaces.com/${fileId}/dash/manifesto.mpd`;
}
