'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, FileVideoIcon, PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { tryCatch } from '@bunpeg/helpers';
import { useDebounce } from '@bunpeg/ui/hooks';

import { env } from '@/env';
import type { StoredFile, UserFile, VideoMeta } from '@/types';
import { appendFile, removeFile, retrieveFiles } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';

interface TrimSegment {
  id: string;
  start: number;
  end: number;
  type: 'keep' | 'delete';
}

export default function TrimPage() {
  const [uploadedFile, setUploadedFile] = useState<StoredFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState<TrimSegment[]>([]);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoError, setVideoError] = useState<{ message: string; suggestions?: string[] } | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  const [lastSeekTime, setLastSeekTime] = useState(0);
  const [videoErrorDialogOpen, setVideoErrorDialogOpen] = useState(false);
  const [videoErrorDetails, setVideoErrorDetails] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    mutate: upload,
    isPending: isUploading,
    variables: localFile,
    isError: mutationFailed,
    error: mutationError,
  } = useMutation<void, Error, File, unknown>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/upload`, {
          method: 'POST',
          body: formData,
        }),
      );

      if (reqError) throw reqError;

      const res = await response.json();
      const fileId = res.fileId as string;
      appendFile('trim', fileId, file.name);
      setUploadedFile({ id: fileId, name: file.name, status: 'pending' });
    },
  });

  const {
    data: file,
    isLoading: loadingFileInfo,
  } = useQuery({
    queryKey: ['file', uploadedFile?.id],
    queryFn: async () => {
      if (!uploadedFile) throw new Error('No file to retreive');

      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files/${uploadedFile.id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${uploadedFile?.id} does not exist.`);
      }

      const data = await response.json();
      return data.file as UserFile;
    },
    enabled: !!uploadedFile,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { data: metadata, isLoading: isLoadingMeta } = useQuery<VideoMeta>({
    queryKey: ['file', uploadedFile?.id, 'meta'],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/meta/${uploadedFile?.id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${uploadedFile?.id} does not exist.`);
      }

      const data = await response.json();
      return data.meta;
    },
    enabled: !!file && !file.metadata,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { data: videoUrl, isLoading: isLoadingUrl } = useQuery({
    queryKey: ['file', uploadedFile?.id, 'url'],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/url/${uploadedFile?.id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${uploadedFile?.id} does not exist.`);
      }

      return await response.text();
    },
    enabled: !!file,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { mutate: deleteFile, isPending: isDeleting } = useMutation<
    void,
    Error,
    string,
    unknown
  >({
    mutationFn: async (fileId) => {
      const response = await fetch(
        `${env.NEXT_PUBLIC_BUNPEG_API}/delete/${fileId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to delete the file');
      }
    },
    onSuccess: async () => {
      removeFile('trim', file!.id);
      setUploadedFile(null);
    },
    onError: (err) => {
      toast.error('Failed to delete the file', { description: err.message });
    },
  });

  const handleLocalFileUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate video file first
    const validation = await validateVideoFile(file);
    if (!validation.isValid) {
      toast.error('Invalid video file', { description: validation.error });
      return;
    }

    upload(file);
  };

  const updateBufferedRanges = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const ranges: { start: number; end: number }[] = [];

    for (let i = 0; i < video.buffered.length; i++) {
      ranges.push({
        start: video.buffered.start(i),
        end: video.buffered.end(i),
      });
    }

    setBufferedRanges(ranges);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    let errorMessage = 'An unknown error occurred while loading the video.';
    let suggestions: string[] = [];

    if (video.error) {
      switch (video.error.code) {
        case video.error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted.';
          suggestions = ['Try refreshing the page', 'Re-upload the video file'];
          break;
        case video.error.MEDIA_ERR_NETWORK:
          errorMessage = 'A network error occurred while loading the video.';
          suggestions = [
            'Check your internet connection',
            'Try uploading a smaller file',
          ];
          break;
        case video.error.MEDIA_ERR_DECODE:
          errorMessage =
            'The video file has decoding issues and cannot be played.';
          suggestions = [
            'Re-encode with H.264 video codec and AAC audio',
            'Use MP4 container format',
            'Try converting with HandBrake or similar tool',
            'Reduce video bitrate and complexity',
          ];
          break;
        case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'The video format is not supported by your browser.';
          suggestions = [
            'Convert to MP4 with H.264 codec',
            'Use a different browser',
            'Try a different video file',
          ];
          break;
        default:
          errorMessage = `Video error: ${video.error.message || 'Unknown error'}`;
      }
    }

    // Handle specific decode errors with detailed guidance
    if (video.error?.message?.includes('PIPELINE_ERROR_DECODE')) {
      errorMessage =
        'Video decoding failed during seeking. This usually happens when seeking to non-keyframe positions.';
      suggestions = [
        'This is often caused by seeking to positions without keyframes.',
        'Try these solutions:',
        '• Reload the video and try seeking to different positions',
        '• Use smaller seek increments (avoid large jumps)',
        '• Re-encode the video with more frequent keyframes:',
        '  - Video: H.264 codec, GOP size 30 or less',
        '  - Audio: AAC codec, 128-192 kbps',
        '  - Container: MP4',
        '  - Use constant frame rate',
      ];
    }

    const errorDetails = {
      code: video.error?.code,
      message: video.error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src?.substring(0, 50) + '...',
      currentTime: video.currentTime,
      duration: video.duration,
      bufferedRanges: bufferedRanges.length,
      wasSeekingWhenErrorOccurred: isSeeking,
    };

    setVideoError({ message: errorMessage, suggestions });
    setVideoErrorDetails(errorDetails);
    setVideoErrorDialogOpen(true);
    setIsPlaying(false);
    setIsSeeking(false);
    setIsBuffering(false);
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Video play/pause error:', error);
        // Reset the playing state if there's an error
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
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

    // Throttle seeking to prevent rapid seeks that can cause decode errors
    const now = Date.now();
    if (now - lastSeekTime < 200) { // Minimum 200ms between seeks
      return;
    }
    setLastSeekTime(now);
    setIsSeeking(true);

    try {
      // Strategy 1: Use fastSeek for approximate seeking (keyframe-aligned)
      if (typeof video.fastSeek === 'function') {
        video.fastSeek(targetTime);

        // Wait for seek to complete
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('FastSeek timeout'));
          }, 5000);

          const onSeeked = () => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            resolve(undefined);
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            reject(new Error('FastSeek failed'));
          };

          video.addEventListener('seeked', onSeeked);
          video.addEventListener('error', onError);
        });
      } else {
        // Strategy 2: Conservative seeking with keyframe alignment
        const wasPlaying = !video.paused;
        if (wasPlaying) {
          video.pause();
        }

        // For small seeks (< 5 seconds), try direct seek
        if (Math.abs(targetTime - video.currentTime) < 5) {
          video.currentTime = targetTime;
        } else {
          // For large seeks, use a more conservative approach
          // Seek to a slightly earlier time to increase chance of hitting a keyframe
          const seekTolerance = 0.5; // 500ms tolerance
          const conservativeTarget = Math.max(0, targetTime - seekTolerance);

          setIsBuffering(true);
          video.currentTime = conservativeTarget;
        }

        // Wait for seek to complete
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Seek timeout'));
          }, 10000);

          const onSeeked = () => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            video.removeEventListener('stalled', onStalled);
            resolve(undefined);
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            video.removeEventListener('stalled', onStalled);
            reject(new Error('Seek failed'));
          };

          const onStalled = () => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            video.removeEventListener('stalled', onStalled);
            reject(new Error('Seek stalled'));
          };

          video.addEventListener('seeked', onSeeked);
          video.addEventListener('error', onError);
          video.addEventListener('stalled', onStalled);
        });

        // Resume playback if it was playing
        if (wasPlaying && video.readyState >= 2) {
          try {
            await video.play();
          } catch (error) {
            console.warn('Could not resume playback after seek:', error);
          }
        }
      }
    } catch (error) {
      console.error('Seek error:', error);

      // Fallback strategy: Progressive seeking with smaller increments
      try {
        const video = videoRef.current;
        if (!video) return;

        setIsBuffering(true);

        // Try seeking to nearby buffered positions first
        const nearestBuffered = bufferedRanges.find(
          (range) =>
            Math.abs(range.start - targetTime) < 10 ||
            Math.abs(range.end - targetTime) < 10,
        );

        if (nearestBuffered) {
          const fallbackTime =
            Math.abs(nearestBuffered.start - targetTime) <
              Math.abs(nearestBuffered.end - targetTime)
              ? nearestBuffered.start
              : nearestBuffered.end;
          video.currentTime = fallbackTime;
          setCurrentTime(fallbackTime);
        } else {
          // Last resort: seek to the nearest 5-second mark (more likely to be a keyframe)
          const alignedTime = Math.round(targetTime / 5) * 5;
          const safeTarget = Math.max(0, Math.min(duration, alignedTime));
          video.currentTime = safeTarget;
          setCurrentTime(safeTarget);
        }
      } catch (fallbackError) {
        console.error('Fallback seek also failed:', fallbackError);
        // Reset to a safe position
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          setCurrentTime(0);
        }
      }
    } finally {
      setIsBuffering(false);
      setIsSeeking(false);
    }
  };

  const handleTimelineClick = async (e: React.MouseEvent) => {
    // Only handle direct clicks, not drag operations
    if (isDragging || dragStart !== null || dragCurrent !== null) return;

    // Prevent if we're already seeking or buffering
    if (isSeeking || isBuffering) return;

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
    // Prevent seeking if we're already in a seeking state
    if (isSeeking || isBuffering) return;

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

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoError(null);
      setVideoErrorDialogOpen(false);
      setVideoErrorDetails(null);
      updateBufferedRanges(); // Initialize buffered ranges
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

  useEffect(() => {
    const storedFiles = retrieveFiles('trim');
    if (!uploadedFile && storedFiles.length > 0) {
      setUploadedFile(storedFiles[0]!);
    }
    // this is only meant to run once on start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timeline and segment marking UI to be implemented
  const meta = metadata ?? file?.metadata ?? null;
  const duration = meta?.duration ? Number(meta.duration) : 0;

  return (
    <section className="mx-auto max-w-3xl px-4 flex flex-col gap-6 py-10">
      <div>
        <Link href="/">
          <Button variant="link" className="px-0">
            <ArrowLeftIcon className="size-4 mr-2" />
            Go back
          </Button>
        </Link>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Trim Video</h1>
          <span className="text-muted-foreground text-sm">
            Upload a video, preview it, and mark segments to delete
          </span>
        </div>
      </div>
      <RenderIf condition={!localFile && !uploadedFile}>
        <FileUploadCard
          description="Accepts a single video file"
          onSuccess={handleLocalFileUpload}
          accept={VIDEO_MIME_TYPES}
          multiple={false}
        />
      </RenderIf>
      <div className="flex flex-col gap-8">
        {localFile && (isUploading || loadingFileInfo || isLoadingMeta || isLoadingUrl) ? (
          <div className="border flex gap-2 p-4">
            <FileVideoIcon className="size-5 mt-1" />
            <div className="flex flex-col gap-1">
              <span>{localFile.name}</span>
              {!mutationFailed && (
                <span className="text-xs text-muted-foreground">
                  {(localFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
              {mutationError && (
                <span className="text-xs text-red-500">{mutationError.message}</span>
              )}
            </div>
            <Loader size="icon" color="primary" className="ml-auto" />
          </div>
        ) : null}
        {file && videoUrl ? (
          <div className="space-y-6">
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

            {/* Video Preview */}
            <>
              <div className="aspect-video bg-black overflow-hidden mb-4">
                <video
                  playsInline
                  preload="meta"
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onError={handleVideoError}
                  onTimeUpdate={handleTimeUpdate}
                  onProgress={updateBufferedRanges}
                  onLoadedMetadata={handleVideoLoad}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onAbort={() => setIsPlaying(false)}
                  onLoadStart={() => setVideoError(null)}
                  onWaiting={() => setIsBuffering(true)}
                  onCanPlay={() => setIsBuffering(false)}
                  onSeeking={() => setIsSeeking(true)}
                  onSeeked={() => setIsSeeking(false)}
                  onStalled={() => {
                    console.warn('Video stalled during playback');
                    setIsBuffering(true);
                  }}
                  onSuspend={() => {
                    console.warn('Video suspended, likely due to decode issues');
                    setIsBuffering(false);
                  }}
                />
              </div>

              {/* Video Controls */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  disabled={!!videoError || isBuffering || isSeeking}
                  className="flex items-center gap-2 bg-transparent w-40"
                >
                  {isBuffering || isSeeking ? (
                    <Loader size="icon" color="primary" />
                  ) : isPlaying ? (
                    <PauseIcon className="w-4 h-4" />
                  ) : (
                    <PlayIcon className="w-4 h-4" />
                  )}
                  {isBuffering
                    ? 'Buffering...'
                    : isSeeking
                      ? 'Seeking...'
                      : isPlaying
                        ? 'Pause'
                        : 'Play'}
                </Button>
                <span className="text-sm text-gray-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Timeline Slider */}
              <div className="mb-4">
                <div className="relative">
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    max={duration}
                    step={0.1}
                    className="w-full"
                    disabled={isSeeking || isBuffering}
                  />

                  {/* Buffered ranges visualization */}
                  <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                    {bufferedRanges.map((range, index) => (
                      <div
                        key={index}
                        className="absolute h-full bg-gray-400 bg-opacity-50 rounded"
                        style={{
                          left: `${(range.start / duration) * 100}%`,
                          width: `${((range.end - range.start) / duration) * 100}%`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Buffering indicator */}
                  {(isBuffering || isSeeking) && (
                    <div className="absolute top-0 left-0 right-0 h-2 bg-blue-200 rounded animate-pulse" />
                  )}
                </div>
              </div>

              {/* Timeline for Segment Selection */}
              <div className="space-y-4">
                <div
                  className="relative h-16 bg-gray-200 select-none"
                  style={{ cursor: isDragging ? 'grabbing' : isSeeking ? 'wait' : 'crosshair' }}
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
                      className="absolute top-1 bottom-1 bg-red-400 bg-opacity-70 border-2 border-red-600 border-dashed rounded z-20 pointer-events-none"
                      style={{
                        left: `${Math.min((Math.min(dragStart, dragCurrent) / duration) * 100, 100)}%`,
                        width: `${Math.max(1, (Math.abs(dragCurrent - dragStart) / duration) * 100)}%`,
                      }}
                    >
                      <div className="flex items-center justify-center h-full">
                        {Math.abs(dragCurrent - dragStart) > 1 && (
                          <span className="text-xs text-red-900 font-bold px-1 bg-white bg-opacity-90 rounded shadow">
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
                      className="absolute cursor-default top-2 bottom-2 bg-red-500 bg-opacity-60 border border-red-600 rounded flex items-center justify-center group z-10"
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
            </>
          </div>
        ) : null}
      </div>

      {/* Video Error Dialog */}
      <AlertDialog
        open={videoErrorDialogOpen}
        onOpenChange={setVideoErrorDialogOpen}
      >
        <AlertDialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Video Error
            </AlertDialogTitle>
            <AlertDialogDescription>
              {videoError?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {videoError?.suggestions && videoError.suggestions.length > 0 && (
              <div className="bg-yellow-50 p-4 border border-yellow-200">
                <div className="font-semibold mb-2 text-yellow-800">
                  Suggested Solutions:
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  {videoError.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={
                        suggestion.startsWith('•')
                          ? 'ml-4 text-yellow-600'
                          : 'font-medium'
                      }
                    >
                      {suggestion || <br />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videoErrorDetails && (
              <div className="bg-gray-50 p-4 border">
                <div className="font-semibold mb-2 text-gray-800">
                  Technical Details:
                </div>
                <pre className="text-xs bg-gray-900 text-green-400 p-3 font-mono overflow-x-auto">
                  <code>{JSON.stringify(videoErrorDetails, null, 2)}</code>
                </pre>
              </div>
            )}

            <AlertDialogFooter className="flex gap-2 pt-4">
              <AlertDialogAction
                variant="black"
                onClick={() => {
                  setVideoError(null);
                  setVideoErrorDetails(null);
                  setVideoErrorDialogOpen(false);
                  setCurrentTime(0);
                  setIsSeeking(false);
                  setIsBuffering(false);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.load();
                  }
                }}
              >
                Reload Video
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

const validateVideoFile = async (
  file: File,
): Promise<{ isValid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let hasLoadedData = false;
    let validationComplete = false;

    video.preload = 'auto'; // Load more data for better validation
    video.muted = true; // Prevent audio issues during validation
    video.src = url;

    const cleanup = () => {
      if (!validationComplete) {
        validationComplete = true;
        URL.revokeObjectURL(url);
        video.remove();
      }
    };

    // Test if we can load and play a small portion
    video.onloadeddata = () => {
      hasLoadedData = true;
      // Try to seek to different positions to test decoding
      video.currentTime = Math.min(5, video.duration * 0.1); // Seek to 10% or 5 seconds
    };

    video.onseeked = () => {
      if (hasLoadedData && video.currentTime > 0) {
        cleanup();
        resolve({ isValid: true });
      }
    };

    video.onloadedmetadata = () => {
      // Check for reasonable duration and dimensions
      if (video.duration < 0.1 || video.duration > 7200) {
        // 0.1s to 2 hours
        cleanup();
        resolve({
          isValid: false,
          error:
            'Video duration is invalid. Please use videos between 0.1 seconds and 2 hours.',
        });
        return;
      }

      if (video.videoWidth < 1 || video.videoHeight < 1) {
        cleanup();
        resolve({
          isValid: false,
          error: 'Video has invalid dimensions. Please use a valid video file.',
        });
        return;
      }

      // If duration is very short, skip seeking test
      if (video.duration < 1) {
        cleanup();
        resolve({ isValid: true });
      }
    };

    video.onerror = () => {
      cleanup();
      const errorMessage = video.error?.message || 'Unknown error';

      if (
        errorMessage.includes('PIPELINE_ERROR_DECODE') ||
        errorMessage.includes('DECODE')
      ) {
        resolve({
          isValid: false,
          error:
            `This video file has encoding issues that prevent playback. Please try:\n\n
            • Re-encoding with standard settings (H.264 video, AAC audio, MP4 container)\n
            • Using a different video file\n
            • Converting with a tool like HandBrake or FFmpeg\n\nRecommended settings:\n
            • Video: H.264, CRF 23, Medium preset\n• Audio: AAC, 128kbps\n
            • Container: MP4`,
        });
      } else {
        resolve({
          isValid: false,
          error:
            `Video file appears to be corrupted or uses an unsupported codec.
            Please try a different video file or re-encode it with standard settings.`,
        });
      }
    };

    // Extended timeout for thorough validation
    setTimeout(() => {
      if (!validationComplete) {
        cleanup();
        resolve({
          isValid: false,
          error:
            'Video validation timed out. The file might be corrupted or too large to process efficiently.',
        });
      }
    }, 15000);
  });
};
