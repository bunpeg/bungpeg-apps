'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Loader, RenderIf, Slider, toast } from '@bunpeg/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, FileVideoIcon, PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { tryCatch } from '@bunpeg/helpers';

import { env } from '@/env';
import type { StoredFile, UserFile, VideoMeta } from '@/types';
import { appendFile, retrieveFiles } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';

interface TrimSegment {
  id: string;
  start: number;
  end: number;
  type: 'keep' | 'delete';
}

export default function TrimPage() {
  // const [localFile, setLocalFile] = useState<{ id: string; file: File } | null>(null);
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
        'Video decoding failed due to corrupted or incompatible video data.';
      suggestions = [
        'Re-encode the video with these recommended settings:',
        '• Video: H.264 codec, CRF 23, Medium preset',
        '• Audio: AAC codec, 128-192 kbps',
        '• Container: MP4',
        '• Frame rate: 24, 25, or 30 fps',
        '',
        'Tools you can use:',
        '• HandBrake (free, user-friendly)',
        '• FFmpeg (command-line)',
        '• Online converters (for smaller files)',
      ];
    }

    console.error('Video error details:', {
      code: video.error?.code,
      message: video.error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src?.substring(0, 50) + '...',
      currentTime: video.currentTime,
      duration: video.duration,
    });

    setVideoError({ message: errorMessage, suggestions });
    setIsPlaying(false);
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

  const handleSeek = async (value: number[]) => {
    const targetTime = value[0];

    if (
      !videoRef.current ||
      !targetTime ||
      targetTime < 0 ||
      targetTime > duration
    ) {
      return;
    }

    const video = videoRef.current;

    // Check if target time is within buffered ranges
    const isBuffered = bufferedRanges.some(
      (range) => targetTime >= range.start && targetTime <= range.end,
    );

    setIsSeeking(true);
    setCurrentTime(targetTime); // Update UI immediately for responsiveness

    try {
      if (isBuffered || Math.abs(targetTime - video.currentTime) < 5) {
        // Direct seek for small jumps or buffered content
        video.currentTime = targetTime;
      } else {
        // Progressive seek for large jumps to unbuffered content
        setIsBuffering(true);

        // Pause video during seeking
        const wasPlaying = !video.paused;
        if (wasPlaying) {
          video.pause();
        }

        // Set target time
        video.currentTime = targetTime;

        // Wait for seek to complete
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Seek timeout'));
          }, 10000); // 10 second timeout

          const onSeeked = () => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            resolve(undefined);
          };

          const onError = () => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            reject(new Error('Seek failed'));
          };

          video.addEventListener('seeked', onSeeked);
          video.addEventListener('error', onError);
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
      // Fallback: try to seek to a nearby buffered position
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
      }
    } finally {
      setIsBuffering(false);
      setIsSeeking(false);
    }
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    console.log('Mouse down - starting drag at:', time);
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

    console.log('Mouse move - updating drag to:', time);
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

    console.log('Mouse up - creating segment:', start, 'to', end);

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
    console.log('Mouse leave - canceling drag');
    setDragStart(null);
    setDragCurrent(null);
    setIsDragging(false);
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoError(null);
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
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PlayIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {file.file_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {file.id}
                      {meta ? (
                        <>
                          | size: {meta.size / 1024 / 1024} |
                          duration: {duration.toFixed(2)} | res:{' '}
                          {meta.resolution.width}x{meta.resolution.height}
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Uploaded</Badge>
              </div>
            </Card>

            {/* Video Preview */}
            <Card className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
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
                />
                {videoError && (
                  <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
                    <div className="text-center text-white max-w-lg">
                      <div className="text-red-400 mb-3 text-lg">
                        ⚠️ Video Error
                      </div>
                      <div className="text-sm leading-relaxed mb-4">
                        {videoError.message}
                      </div>

                      {videoError.suggestions && videoError.suggestions.length > 0 && (
                        <div className="text-left bg-gray-800 p-4 rounded-lg mb-4 text-xs">
                          <div className="font-semibold mb-2 text-yellow-400">
                            Suggested Solutions:
                          </div>
                          {videoError.suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className={
                                suggestion.startsWith('•')
                                  ? 'ml-2 text-gray-300'
                                  : 'text-white'
                              }
                            >
                              {suggestion || <br />}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-black bg-white hover:bg-gray-100"
                          onClick={() => {
                            setVideoError(null);
                            if (videoRef.current) {
                              videoRef.current.load();
                            }
                          }}
                        >
                          Try Again
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-black bg-white hover:bg-gray-100 ml-2"
                          onClick={() => {
                            setUploadedFile(null);
                            setVideoError(null);
                            setSegments([]);
                            setCurrentTime(0);
                          }}
                        >
                          Upload Different Video
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  disabled={!!videoError || isBuffering || isSeeking}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {isBuffering || isSeeking ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
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
                {videoError && (
                  <span className="text-sm text-red-500">Video Error</span>
                )}
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
                    disabled={isSeeking}
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

                {(isBuffering || isSeeking) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {isBuffering ? 'Buffering...' : 'Seeking...'}
                  </p>
                )}
              </div>

              {/* Timeline for Segment Selection */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Timeline - Click and drag to mark segments for deletion
                </h3>

                <div
                  className="relative h-16 bg-gray-200 rounded-lg select-none"
                  style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
                  onMouseDown={handleTimelineMouseDown}
                  onMouseMove={handleTimelineMouseMove}
                  onMouseUp={handleTimelineMouseUp}
                  onMouseLeave={handleTimelineMouseLeave}
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
                      className="absolute top-2 bottom-2 bg-red-500 bg-opacity-60 border border-red-600 rounded flex items-center justify-center group z-10"
                      style={{
                        left: `${duration > 0 ? (segment.start / duration) * 100 : 0}%`,
                        width: `${duration > 0 ? ((segment.end - segment.start) / duration) * 100 : 0}%`,
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSegment(segment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      >
                        <Trash2Icon className="w-3 h-3 text-red-700" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Drag feedback */}
                {isDragging && dragStart !== null && dragCurrent !== null && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <span>Creating segment:</span>
                      <span className="font-mono">
                        {formatTime(Math.min(dragStart, dragCurrent))} -{' '}
                        {formatTime(Math.max(dragStart, dragCurrent))}
                      </span>
                      <span className="text-blue-600">
                        (Duration:{' '}
                        {formatTime(Math.abs(dragCurrent - dragStart))})
                      </span>
                      {Math.abs(dragCurrent - dragStart) < 0.5 && (
                        <span className="text-orange-600">
                          ⚠️ Minimum 0.5s required
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced debug info */}
                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <div>Debug Info:</div>
                  <div>isDragging: {isDragging.toString()}</div>
                  <div>dragStart: {dragStart?.toFixed(2) || 'null'}</div>
                  <div>dragCurrent: {dragCurrent?.toFixed(2) || 'null'}</div>
                  <div>duration: {duration.toFixed(2)}</div>
                  <div>segments: {segments.length}</div>
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
            </Card>
          </div>
        ) : null}
      </div>
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
            'This video file has encoding issues that prevent playback. Please try:\n\n• Re-encoding with standard settings (H.264 video, AAC audio, MP4 container)\n• Using a different video file\n• Converting with a tool like HandBrake or FFmpeg\n\nRecommended settings:\n• Video: H.264, CRF 23, Medium preset\n• Audio: AAC, 128kbps\n• Container: MP4',
        });
      } else {
        resolve({
          isValid: false,
          error:
            'Video file appears to be corrupted or uses an unsupported codec. Please try a different video file or re-encode it with standard settings.',
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
