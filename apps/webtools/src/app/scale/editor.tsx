'use client'

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CpuIcon, FileVideoIcon, Trash2Icon, CheckIcon } from 'lucide-react';
import { Button, cn, Loader, toast } from '@bunpeg/ui';

import { env } from '@/env';
import { type StoredFile } from '@/types';
import { pollFileStatus } from '@/utils/api';
import useFile from '@/utils/hooks/useFile';
import useFileMeta from '@/utils/hooks/useFileMeta';
import { appendFile, markFileAsProcessed } from '@/utils/file-store';

import Wrapper from './wrapper';

interface Props {
  file: StoredFile;
  isDeleting: boolean;
  onRemove: () => void;
  onProcessed: (newFileId: string) => void;
}

interface Resolution {
  name: string;
  width: number;
  height: number;
}

// Common video resolutions in descending order
const STANDARD_RESOLUTIONS: Resolution[] = [
  { name: '4K (2160p)', width: 3840, height: 2160 },
  { name: '2K (1440p)', width: 2560, height: 1440 },
  { name: '1080p', width: 1920, height: 1080 },
  { name: '720p', width: 1280, height: 720 },
  { name: '480p', width: 854, height: 480 },
  { name: '360p', width: 640, height: 360 },
  { name: '240p', width: 426, height: 240 },
];

export default function Editor(props: Props) {
  const { isDeleting, onRemove, onProcessed } = props;
  const fileId = props.file.id;
  const fileName = props.file.name;

  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [availableResolutions, setAvailableResolutions] = useState<Resolution[]>([]);

  const { data: file, isLoading: isLoadingFileInfo, error: fileError } = useFile(fileId);

  const { data: metadata, isLoading: isLoadingMeta, error: metaError } = useFileMeta(fileId, {
    enabled: !!file && !file.metadata,
  });

  const { mutate: scaleVideo, isPending: isScaling } = useMutation<string, Error, Resolution>({
    mutationFn: async (resolution) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/chain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          operations: [{
            type: 'resize-video',
            width: resolution.width,
            height: resolution.height,
            output_format: resolveFormat(fileName),
          }],
        }),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to scale the video');
      }

      const result = await response.json();
      await pollFileStatus(fileId);

      return result.file_id;
    },
    onSuccess: (newFileId) => {
      appendFile('scale', newFileId, fileName);
      markFileAsProcessed('scale', fileId);
      onProcessed(newFileId);
    },
    onError: (error) => {
      toast.error('Failed to scale video', { description: error.message });
    },
  });

  // Calculate available resolutions based on current video resolution
  useEffect(() => {
    const meta = metadata ?? file?.metadata;
    if (meta?.resolution?.width && meta?.resolution?.height) {
      const currentWidth = meta.resolution.width;
      const currentHeight = meta.resolution.height;

      // Filter resolutions that are smaller than current video
      const smaller = STANDARD_RESOLUTIONS.filter(res =>
        res.width < currentWidth && res.height < currentHeight
      );

      setAvailableResolutions(smaller);

      // Set default selection to the largest available smaller resolution
      if (smaller.length > 0 && !selectedResolution) {
        setSelectedResolution(smaller[0]!);
      }
    }
  }, [metadata, file?.metadata, selectedResolution]);

  const error = fileError ?? metaError;
  const meta = metadata ?? file?.metadata;
  const currentResolution = meta?.resolution;

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

  if (!file || !currentResolution?.width || !currentResolution?.height) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <FileVideoIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-red-500">
              Unable to determine video resolution
            </span>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (availableResolutions.length === 0) {
    return (
      <Wrapper
        action={
          <Button
            size="icon"
            variant="outline"
            onClick={onRemove}
            disabled={isDeleting}
          >
            <Trash2Icon className="size-4" />
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="border flex gap-2 p-4">
            <FileVideoIcon className="size-5 mt-1" />
            <div className="flex flex-col gap-1">
              <span>{fileName}</span>
              <span className="text-xs text-muted-foreground">
                Current resolution: {currentResolution.width}x{currentResolution.height}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">No scaling options available</h3>
            <p className="text-sm text-yellow-700">
              Your video resolution ({currentResolution.width}x{currentResolution.height}) is already
              at or below the smallest standard resolution we support.
              No smaller resolutions are available for scaling.
            </p>
          </div>
        </div>
      </Wrapper>
    );
  }

  const handleScale = () => {
    if (!selectedResolution) {
      toast.error('Please select a resolution');
      return;
    }
    scaleVideo(selectedResolution);
  };

  return (
    <Wrapper
      action={
        <div className="flex items-center gap-2">
          {selectedResolution && (
            <Button
              onClick={handleScale}
              disabled={isScaling}
            >
              {isScaling ? (
                <Loader size="icon" color="white" className="mr-2" />
              ) : (
                <CpuIcon className="size-4 mr-2" />
              )}
              Process
            </Button>
          )}

          <Button
            size="icon"
            variant="outline"
            onClick={onRemove}
            disabled={isDeleting || isScaling}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col border">
        {/* Current File Info */}
        <div className="flex gap-2 p-4">
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-muted-foreground">
              Current resolution: {currentResolution.width}x{currentResolution.height}
              {meta?.duration ? ` | Duration: ${Number(meta.duration).toFixed(2)}s` : ''}
              {meta?.size ? ` | Size: ${(meta.size / 1024 / 1024).toFixed(2)}MB` : ''}
            </span>
          </div>
        </div>

        <div className="h-5 w-full stripped-bg border-t border-b my-2" />

        {/* Resolution Selection Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableResolutions.map((resolution) => {
            const isSelected = selectedResolution?.name === resolution.name;
            const sizeReduction = Math.round((1 - (resolution.width * resolution.height) / (currentResolution.width! * currentResolution.height!)) * 100);

            return (
              <button
                key={resolution.name}
                onClick={() => setSelectedResolution(resolution)}
                disabled={isScaling}
                className={cn(
                  'p-3 border text-left transition-all relative',
                  'hover:border-primary/50 hover:bg-primary/10',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  { 'border-primary': isSelected },
                )}
              >
                <div className="font-medium text-sm">{resolution.name}</div>
                <div className="text-xs text-muted-foreground">
                  {resolution.width} × {resolution.height}
                </div>
                <div className="text-xs text-primary font-medium mt-1">
                  ~{sizeReduction}% smaller
                </div>
                <div data-selected={isSelected} className="absolute top-0 right-0 bg-primary p-1 flex items-center justify-center transition-opacity opacity-0 data-[selected=true]:opacity-100">
                  <CheckIcon strokeWidth={5} className="size-3 text-background" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Wrapper>
  );
}

// Helper function to resolve output format based on filename
function resolveFormat(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'mov':
      return 'mov';
    case 'avi':
      return 'avi';
    case 'mkv':
      return 'mkv';
    case 'webm':
      return 'webm';
    default:
      return 'mp4';
  }
}
