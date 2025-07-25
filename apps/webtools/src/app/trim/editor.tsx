'use client'

import dynamic from 'next/dynamic';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, useEffect, useCallback } from 'react';
import { CpuIcon, FileVideoIcon, Trash2Icon } from 'lucide-react';
import {
  Button,
  cn,
  Loader,
  RenderIf,
  toast,
} from '@bunpeg/ui';
import { tryCatch } from '@bunpeg/helpers';
import type * as dashjs from 'dashjs';

import { env } from '@/env';
import { buildCdnUrl, pollFileStatus } from '@/utils/api';
import { appendFile, markFileAsProcessed } from '@/utils/file-store';
import { type StoredFile, type UserFile } from '@/types';
import useFile from '@/utils/hooks/useFile';
import useFileMeta from '@/utils/hooks/useFileMeta';

import Wrapper from './wrapper';

const DynamicDashVideoPlayer = dynamic(() => import('../../components/dash-player'), { ssr: false });

interface Props {
  file: StoredFile;
  isDeleting: boolean;
  onRemove: () => void;
  onProcessed: (newFileId: string) => void;
}

interface TrimSegment {
  id: string;
  start: number;
  end: number;
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
  const { isDeleting, onRemove } = props;
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

  const { data: file, isLoading: isLoadingFileInfo, error: fileError } = useFile(fileId);

  const { data: metadata, isLoading: isLoadingMeta, error: metaError } = useFileMeta(fileId, {
    enabled: !!file && !file.metadata,
  });

  const { mutate: removeSegments, isPending: isMerging } = useMutation<string, Error, Omit<TrimSegment, 'id'>[]>({
    mutationFn: async (segments) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/chain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          operations: segments.map((seg) => ({
            type: 'trim',
            mode: 'append',
            exact: true,
            start: seg.start,
            duration: seg.end - seg.start,
            output_format: resolveFormat(fileName),
            parent: fileId,
          })),
        }),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to chain the segments');
      }

      await pollFileStatus(fileId);

      const newFilesRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files?parent=${fileId}`);

      if (!newFilesRes.ok || newFilesRes.status !== 200) {
        throw new Error('Unable to retreive the new segments');
      }

      let mergedFile;

      const files = (await newFilesRes.json()).files as UserFile[];
      if (files.length === 0) throw new Error('No files found');

      if (files.length === 1) {
        mergedFile = files.at(-1);
      } else {
        const mergeRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/merge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_ids: files.map((file) => file.id),
            output_format: resolveFormat(fileName),
            mode: 'append',
            parent: fileId,
          }),
        });

        if (!mergeRes.ok || mergeRes.status !== 200) {
          throw new Error('Unable to merge the new segments');
        }

        await pollFileStatus(fileId);

        const latestFilesRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files?parent=${fileId}`);

        if (!latestFilesRes.ok || latestFilesRes.status !== 200) {
          throw new Error('Unable to retreive the latest files');
        }

        const latestFiles = (await latestFilesRes.json()).files as UserFile[];
        if (latestFiles.length === 0) throw new Error('No files found');

        mergedFile = latestFiles.at(-1);
      }

      if (!mergedFile) throw new Error('Unable to find the merged file');

      const dashRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/dash/${mergedFile.id}`);

      if (!dashRes.ok || dashRes.status !== 200) {
        throw new Error('Unable to generate the dash files for the newly cut video');
      }

      await pollFileStatus(fileId);
      return mergedFile.id;
    },
    onSuccess: async (mergedFileId) => {
      appendFile('trim', mergedFileId, fileName);
      markFileAsProcessed('trim', mergedFileId);
      props.onProcessed(mergedFileId);
    },
    onError: (err) => {
      toast.error('Failed to remove the segments', { description: err.message });
    },
  });

  // Timeline and segment marking UI to be implemented
  const meta = metadata ?? file?.metadata ?? null;
  const duration = meta?.duration ? Number(meta.duration) : 0;
  const currentResolution = meta?.resolution;

  const resolveFormat = (fileName: string) => {
    const parts = fileName.split('.');
    return parts.at(-1)!;
  }

  const snapToGrid = useCallback((time: number) => {
    const gridSize = TIMELINE_CONFIG.GRID_INTERVAL;
    const snapped = Math.round(time / gridSize) * gridSize;
    return Math.abs(snapped - time) < TIMELINE_CONFIG.SNAP_TOLERANCE ? snapped : time;
  }, []);

  const checkSegmentCollision = useCallback((start: number, end: number, excludeId?: string): TrimSegment | null => {
    for (const segment of segments) {
      if (excludeId && segment.id === excludeId) continue;
      if (start < segment.end && end > segment.start) {
        return segment; // Return the colliding segment
      }
    }
    return null; // No collision
  }, [segments]);

  const findNearestValidPosition = useCallback((targetStart: number, targetEnd: number, excludeId?: string) => {
    const otherSegments = segments.filter(seg => excludeId ? seg.id !== excludeId : true);

    // Sort segments by start time
    const sortedSegments = [...otherSegments].sort((a, b) => a.start - b.start);

    // Try to fit the segment at the target position
    if (!checkSegmentCollision(targetStart, targetEnd, excludeId)) {
      return { start: targetStart, end: targetEnd };
    }

    // Find the nearest valid position
    const segmentDuration = targetEnd - targetStart;

    // Try before each existing segment
    for (const segment of sortedSegments) {
      const candidateEnd = segment.start;
      const candidateStart = candidateEnd - segmentDuration;
      if (candidateStart >= 0 && !checkSegmentCollision(candidateStart, candidateEnd, excludeId)) {
        return { start: candidateStart, end: candidateEnd };
      }
    }

    // Try after each existing segment
    for (const segment of sortedSegments) {
      const candidateStart = segment.end;
      const candidateEnd = candidateStart + segmentDuration;
      if (candidateEnd <= duration && !checkSegmentCollision(candidateStart, candidateEnd, excludeId)) {
        return { start: candidateStart, end: candidateEnd };
      }
    }

    // If no valid position found, return original
    return null;
  }, [segments, checkSegmentCollision, duration]);

  const updateSegmentStart = useCallback((segmentId: string, newStart: number) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        let potentialStart = newStart;
        let finalStart = potentialStart;

        const collidingSegment = checkSegmentCollision(potentialStart, segment.end, segmentId);
        if (collidingSegment) {
          // If expanding left (newStart < segment.start, trying to go left of current start)
          if (newStart < segment.start) {
            finalStart = Math.max(potentialStart, collidingSegment.end);
          } else { // If shrinking left (newStart > segment.start, trying to go right of current start)
            finalStart = Math.min(potentialStart, collidingSegment.start - TIMELINE_CONFIG.MIN_SEGMENT_DURATION);
          }
        }
        // Ensure finalStart is never less than 0
        finalStart = Math.max(0, finalStart);
        // Ensure finalStart doesn't make segment shorter than MIN_SEGMENT_DURATION
        finalStart = Math.min(finalStart, segment.end - TIMELINE_CONFIG.MIN_SEGMENT_DURATION);

        return { ...segment, start: finalStart };
      }
      return segment;
    }));
  }, [checkSegmentCollision]);

  const updateSegmentEnd = useCallback((segmentId: string, newEnd: number) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        let potentialEnd = newEnd;
        let finalEnd = potentialEnd;

        const collidingSegment = checkSegmentCollision(segment.start, potentialEnd, segmentId);
        if (collidingSegment) {
          // If expanding right (newEnd > segment.end, trying to go right of current end)
          if (newEnd > segment.end) {
            finalEnd = Math.min(potentialEnd, collidingSegment.start); // Snap to the start of the colliding segment
          } else { // If shrinking right (newEnd < segment.end, trying to go left of current end)
            finalEnd = Math.max(potentialEnd, collidingSegment.end + TIMELINE_CONFIG.MIN_SEGMENT_DURATION); // Prevent shrinking into it
          }
        }
        // Ensure finalEnd is never greater than duration
        finalEnd = Math.min(duration, finalEnd);
        // Ensure finalEnd doesn't make segment shorter than MIN_SEGMENT_DURATION
        finalEnd = Math.max(finalEnd, segment.start + TIMELINE_CONFIG.MIN_SEGMENT_DURATION);

        return { ...segment, end: finalEnd };
      }
      return segment;
    }));
  }, [duration, checkSegmentCollision]);

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
          // Check for collision before creating the segment
          if (!checkSegmentCollision(previewSegment.start, previewSegment.end)) {
            const newSegment: TrimSegment = {
              id: Math.random().toString(36).slice(2, 9),
              start: previewSegment.start,
              end: previewSegment.end,
            };
            setSegments(prev => [...prev, newSegment]);
          }
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
  }, [dragState, previewSegment, duration, snapToGrid, updateSegmentStart, updateSegmentEnd, checkSegmentCollision, findNearestValidPosition]);

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

  const resolveMarkers = async () => {
    const inverseMarkers = segments.toSorted((a, b) => a.start - b.start).reduce((acc, seg, index, list) => {
      const isFirst = index === 0;
      const isLast = index === segments.length - 1;

      if (list.length === 1) {
        if (seg.start === 0 && Number(seg.end.toFixed(0)) === Number(duration.toFixed(0))) {
          toast.error('Error', {
            description: 'The segment can not cover the whole file',
          });
          throw new Error('Segment covers whole file');
        }

        if (seg.start === 0) {
          return [seg.end, duration];
        }

        if (Number(seg.end.toFixed(0)) === Number(duration.toFixed(0))) {
          return [0, seg.start];
        }
      }

      if (isFirst) {
        if (seg.start === 0) {
          return [seg.end, list[index + 1]!.start];
        }

        return [0, seg.start, seg.end, list[index + 1]!.start];
      }

      if (Number(seg.end.toFixed(0)) === Number(duration.toFixed(0))) {
        return acc;
      }

      if (isLast) {
        return [...acc, seg.end, duration];
      }

      return [...acc, seg.end, list[index + 1]!.start];

    }, [] as number[]);
    return inverseMarkers;
  }

  const processFile = async () => {
    const { data: inverseMarkers, error } = await tryCatch(resolveMarkers());

    if (error) {
      console.error(error);
      return;
    }

    const keepSegments: { start: number, end: number }[] = [];
    for (let i = 0; i < inverseMarkers.length; i += 2) {
      if (inverseMarkers[i + 1] === undefined) break;

      keepSegments.push({ start: inverseMarkers[i]!, end: inverseMarkers[i + 1]! });
    }

    removeSegments(keepSegments);
  };

  const error = fileError ?? metaError;

  if (isLoadingFileInfo || isLoadingMeta) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <FileVideoIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
          </div>
          <RenderIf condition={!error}>
            <Loader size="icon" color="primary" className="ml-auto" />
          </RenderIf>
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
        <span>Failed to load file or video URL</span>
      </Wrapper>
    );
  }

  const hasSegments = segments.length > 0;

  return (
    <Wrapper
      action={
        <div className="flex items-center gap-1">
          <Button variant="outline" onClick={processFile} disabled={!hasSegments || isMerging || isDeleting}>
            {isMerging ? <Loader size="icon" color="primary" className="mr-2" /> : <CpuIcon className="size-4 mr-2" />}
            Process
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="ml-auto"
            onClick={onRemove}
            disabled={isDeleting || isMerging}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col border">
        {/* Uploaded File Info */}
        <div className="flex flex-col gap-1 p-4">
          <span>{fileName}</span>
          <span className="text-xs text-muted-foreground">
            Current resolution: {currentResolution!.width}x{currentResolution!.height}
            {meta?.duration ? ` | Duration: ${Number(meta.duration).toFixed(2)}s` : ''}
            {meta?.size ? ` | Size: ${(meta.size / 1024 / 1024).toFixed(2)}MB` : ''}
          </span>
        </div>

        <div className="h-5 w-full stripped-bg border-t border-b mb-4" />

        <DynamicDashVideoPlayer
          controls
          ref={videoRef}
          src={buildCdnUrl(fileId)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
          className="max-h-[calc(100vh_-_200px)]"
        />

        {/* Timeline for Segment Selection */}
        <div className="p-4">
          <div className="relative overflow-hidden">
            <div
              ref={timelineRef}
              data-dragstyle={dragState.type}
              className={cn(
                'relative h-20 border-2 border-primary select-none overflow-hidden cursor-pointer',
                'data-[dragstyle=create]:cursor-crosshair data-[dragstyle=resize-start]:cursor-col-resize data-[dragstyle=resize-end]:cursor-col-resize'
              )}
              tabIndex={0}
              role="slider"
              aria-label="Video timeline"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={handleTimelineMouseMove}
              onMouseUp={handleTimelineMouseUp}
              onMouseLeave={handleTimelineMouseLeave}
            >
              {/* Grid markers */}
              {Array.from({ length: Math.ceil(duration / TIMELINE_CONFIG.GRID_INTERVAL) + 1 }, (_, i) => {
                const time = i * TIMELINE_CONFIG.GRID_INTERVAL;
                if (time > duration) return null;
                const isMainMarker = i % 5 === 0;
                return (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 w-px ${isMainMarker ? 'bg-primary/30' : 'bg-primary/10'}`}
                    style={{
                      left: `${duration > 0 ? (time / duration) * 100 : 0}%`,
                    }}
                  />
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
                  className={cn(
                    `absolute top-0 bottom-0 border-2 border-dashed z-30 pointer-events-none`,
                    checkSegmentCollision(previewSegment.start, previewSegment.end)
                      ? 'bg-yellow-200 bg-opacity-70 border-yellow-600'
                      : 'bg-primary/60 border-primary'
                  )}
                  style={{
                    left: `${(previewSegment.start / duration) * 100}%`,
                    width: `${Math.max(0.5, ((previewSegment.end - previewSegment.start) / duration) * 100)}%`,
                  }}
                >
                  <div className="flex items-center justify-center h-full">
                    {previewSegment.end - previewSegment.start > 1 && (
                      <span
                        className={cn(
                          `text-xs font-bold px-1 bg-white bg-opacity-90`,
                          checkSegmentCollision(previewSegment.start, previewSegment.end)
                            ? 'text-yellow-900'
                            : 'text-primary'

                        )}
                      >
                        {checkSegmentCollision(previewSegment.start, previewSegment.end) ? 'Overlap!' : formatTime(previewSegment.end - previewSegment.start)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Collision boundaries for active resize */}
              {dragState.type === 'resize-start' || dragState.type === 'resize-end' ? (
                segments
                  .filter(s => s.id !== dragState.segmentId)
                  .map((boundarySegment) => (
                    <div
                      key={`boundary-${boundarySegment.id}`}
                      className="absolute top-0 bottom-0 bg-orange-400 border-2 border-orange-400 z-50 pointer-events-none"
                      style={{
                        left: `${duration > 0 ? (boundarySegment.start / duration) * 100 : 0}%`,
                        width: `${duration > 0 ? Math.max(1, ((boundarySegment.end - boundarySegment.start) / duration) * 100) : 0}%`,
                      }}
                    >
                      <div className="flex items-center justify-center h-full">
                        <span className="text-xs text-black font-bold px-1">
                          Blocked
                        </span>
                      </div>
                    </div>
                  ))
              ) : null}

              {/* Existing segments */}
              {segments.map((segment) => {
                const isDragging = dragState.segmentId === segment.id;
                return (
                  <div
                    key={segment.id}
                    className={cn(
                      `absolute top-0 bottom-0 border-r border-l flex items-center justify-center group z-20`,
                      dragState.segmentId === segment.id
                        ? 'bg-primary/70 border-primary'
                        : 'bg-primary/60 border-primary'
                    )}
                    style={{
                      left: `${duration > 0 ? (segment.start / duration) * 100 : 0}%`,
                      width: `${duration > 0 ? Math.max(1, ((segment.end - segment.start) / duration) * 100) : 0}%`,
                    }}
                    onMouseEnter={() => setHoveredSegment(segment.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    {/* Start resize handle */}
                    <div
                      className={cn(
                        `absolute -left-2 top-0 bottom-0 w-2 bg-primary cursor-w-resize opacity-0 group-hover:opacity-100 hover:w-3 hover:-left-3 transition-all z-30 flex items-center justify-center`,
                        dragState.type === 'resize-start' && isDragging ? '!opacity-100' : ''
                      )}
                      onMouseDown={handleSegmentResizeStart(segment.id, 'start')}
                      title="Drag to adjust start time"
                    >
                      <div className="w-px h-4 bg-white opacity-80"></div>
                    </div>

                    {/* End resize handle */}
                    <div
                      className={cn(
                        `absolute -right-2 top-0 bottom-0 w-2 bg-primary cursor-e-resize opacity-0 group-hover:opacity-100 hover:w-3 hover:-right-3 transition-all z-30 flex items-center justify-center`,
                        dragState.type === 'resize-end' && isDragging ? 'opacity-100' : ''
                      )}
                      onMouseDown={handleSegmentResizeStart(segment.id, 'end')}
                      title="Drag to adjust end time"
                    >
                      <div className="w-px h-4 bg-white opacity-80"></div>
                    </div>

                    {/* Segment content */}
                    <div
                      className="flex items-center justify-center px-2 cursor-pointer group/content"
                      title={`Delete segment: ${formatTime(segment.start)} - ${formatTime(segment.end)}`}
                    >
                      <span className="text-xs text-white font-medium group-hover/content:hidden">
                        {segment.end - segment.start}s
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => removeSegment(segment.id)}
                        className="p-2 h-auto hidden group-hover/content:flex bg-primary"
                        title="Delete segment"
                      >
                        <Trash2Icon className="size-3 text-white" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
