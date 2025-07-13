'use client'

import { poll, tryCatch } from '@bunpeg/helpers';
import { useMutation } from '@tanstack/react-query';
import { Loader, RenderIf, toast } from '@bunpeg/ui';
import { FileVideoIcon } from 'lucide-react';

import { env } from '@/env';
import { appendFile } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';

import Wrapper from './wrapper';
import { pollFileStatus } from '@/utils/api';

interface Props {
  onSuccess: (file: { id: string; name: string }) => void;
}

export default function Uploader(props: Props) {
  const { onSuccess } = props;

  const {
    mutate: upload,
    variables: localFile,
    error: mutationError,
  } = useMutation<void, Error, File, unknown>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadRes, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/upload`, {
          method: 'POST',
          body: formData,
        }),
      );

      if (reqError) throw reqError;

      const fileId = (await uploadRes.json()).fileId as string;

      const { data: dashRes, error: dashErr } = await tryCatch(fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/dash/${fileId}/process`));

      if (dashErr) throw dashErr;

      const processing = !!(await dashRes.json()).success;

      if (!processing) {
        throw new Error('DASH processing failed');
      }

      await pollFileStatus(fileId);

      appendFile('trim', fileId, file.name);
      onSuccess({ id: fileId, name: file.name });
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
    <Wrapper>
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
