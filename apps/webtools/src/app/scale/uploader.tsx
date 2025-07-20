'use client'

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Loader, RenderIf, toast } from '@bunpeg/ui';
import { FileVideoIcon, Trash2Icon } from 'lucide-react';

import { env } from '@/env';
import { appendFile } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import { pollFileStatus } from '@/utils/api';
import useDeleteFile from '@/utils/hooks/useDeleteFile';
import FileUploadCard from '@/components/file-upload';

import Wrapper from './wrapper';

interface Props {
  onSuccess: (file: { id: string; name: string }) => void;
}

export default function Uploader(props: Props) {
  const { onSuccess } = props;
  const [localFileId, setLocalFileId] = useState<string | null>(null);

  const {
    mutate: upload,
    variables: localFile,
    error: mutationError,
    reset,
  } = useMutation<void, Error, File, unknown>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok || uploadRes.status !== 200) {
        throw new Error('Unable to upload the file');
      }

      const fileId = (await uploadRes.json()).fileId as string;
      setLocalFileId(fileId);

      const dashRes = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/dash/${fileId}`)
      if (!dashRes.ok || dashRes.status !== 200) {
        throw new Error('Unable to generate the dash files');
      }

      const processing = !!(await dashRes.json()).success;
      if (!processing) throw new Error('DASH processing failed');

      await pollFileStatus(fileId);

      appendFile('scale', fileId, file.name);
      onSuccess({ id: fileId, name: file.name });
    },
  });

  const { mutateAsync: deleteFile, isPending: isDeleting } = useDeleteFile();

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

  const handleDelete = async () => {
    if (!localFileId) return;
    await deleteFile(localFileId);
    reset();
  };

  if (!localFile) {
    return (
      <Wrapper>
        <FileUploadCard
          description="Accepts a single video file"
          onSuccess={handleLocalFileUpload}
          accept={VIDEO_MIME_TYPES}
          multiple={false}
        />
      </Wrapper>
    )
  }

  return (
    <Wrapper
      action={localFileId && mutationError ? (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="ml-auto"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ) : null}
    >
      <div className="border flex gap-2 p-4">
        <FileVideoIcon className="size-5 mt-1" />
        <div className="flex flex-col gap-1">
          <span>{localFile.name}</span>
          {mutationError && (
            <span className="text-xs text-red-500">{mutationError.message}</span>
          )}
        </div>
        <RenderIf condition={!mutationError}>
          <Loader size="icon" color="primary" className="ml-auto" />
        </RenderIf>
      </div>
    </Wrapper>
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
