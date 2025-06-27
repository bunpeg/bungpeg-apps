'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Loader, RenderIf, toast } from '@bunpeg/ui';
import { ArrowLeftIcon, CpuIcon } from 'lucide-react';
import { append, applyWhere, remove, tryCatch } from '@bunpeg/helpers';
import { nanoid } from 'nanoid';
import { useMutation } from '@tanstack/react-query';

import { env } from '@/env';
import { markFileAsProcessing, retrieveFiles, type StoredFile } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';
import UploadButton from '@/components/upload-button';
import { DbFileCard, UploadFileCard } from '@/components/file-card';

export default function RemoveAudioPage() {
  const [localFiles, setLocalFiles] = useState<{ id: string; file: File }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<StoredFile[]>([]);

  const { mutate: process } = useMutation({
    mutationFn: async () => {
      const pendingFiles = uploadedFiles.filter((f) => f.status === 'pending');

      if (pendingFiles.length === 0) {
        toast('No files left to process');
        return;
      }

      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/bulk`, {
          method: 'POST',
          body: JSON.stringify({
            fileIds: pendingFiles.map(f => f.id),
            operation: {
              type: 'remove-audio',
              outputFormat: 'mp4',
            },
          })
        })
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        const error = await response.text();
        throw new Error(error ?? `Something went wrong with the server`);
      }

      for (const file of pendingFiles) {
        markFileAsProcessing('remove-audio', file.id);
      }

      setUploadedFiles(
        (prev) => applyWhere(prev, (f) => f.status === 'pending', (f) => ({ ...f, status: 'processing' }))
      )
    },
    onError: (err) => {
      toast.error('Failed to start processing files', { description: err.message });
    }
  });

  const handleLocalFileUpload = (files: File[]) => {
    const newFiles = files.map((f) => ({ id: nanoid(8), file: f }))
    setLocalFiles((prev) => append(prev, ...newFiles));
  }

  const handleUploadFile = (localId: string, fileId: string, name: string) => {
    setLocalFiles((prev) => {
      const index = prev.findIndex(x => x.id === localId);
      if (index === -1) return prev;
      return remove(prev, index);
    });
    setUploadedFiles((prev) => append(prev, { id: fileId, name, status: 'pending' }));
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const fileIndex = prev.findIndex((f) => f.id === id);
      if (fileIndex === -1) return prev;
      return remove(prev, fileIndex);
    })
  }

  const handleProcessedFile = (id: string) => {
    setUploadedFiles((prev) => applyWhere(prev, (f) => f.id === id, (f) => ({ ...f, status: 'processed' })));
  }

  const handleFailedFile = (id: string) => {
    setUploadedFiles((prev) => applyWhere(prev, (f) => f.id === id, (f) => ({ ...f, status: 'failed' })));
  }

  useEffect(() => {
    const storedFiles = retrieveFiles('remove-audio');
    if (uploadedFiles.length === 0 && storedFiles.length > 0) {
      setUploadedFiles(storedFiles);
    }
    // this is only meant to run once on start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasFiles = localFiles.length > 0 || uploadedFiles.length > 0;

  const pendingFiles = uploadedFiles.filter((f) => f.status === 'pending');
  const processingFiles = uploadedFiles.filter((f) => f.status === 'processing');
  const processedFiles = uploadedFiles.filter((f) => f.status === 'processed');
  const failedFiles = uploadedFiles.filter((f) => f.status === 'failed');

  const isProcessing = processingFiles.length > 0;

  return (
    <section className="mx-auto max-w-4xl px-4 flex flex-col gap-6 py-10">
      <div>
        <Link href="/">
          <Button variant="link" className="px-0">
            <ArrowLeftIcon className="size-4 mr-2" />
            Go back
          </Button>
        </Link>
      </div>
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl">Remove audio</h1>
          <span className="text-muted-foreground text-sm">
            Upload the source files you want to remove the audio from
          </span>
        </div>
        <RenderIf condition={hasFiles}>
          <div className="flex items-center gap-1">
            <Button variant="outline" onClick={() => process()} disabled={isProcessing}>
              {
                isProcessing
                  ? <Loader size="icon" color="primary" className="mr-2" />
                  : <CpuIcon className="size-4 mr-2" />
              }
              Process
            </Button>
            <UploadButton multiple accept={VIDEO_MIME_TYPES} onSuccess={handleLocalFileUpload} />
          </div>
        </RenderIf>
      </div>
      <RenderIf condition={!hasFiles}>
        <FileUploadCard
          description="Accepts video files"
          onSuccess={handleLocalFileUpload}
          accept={VIDEO_MIME_TYPES}
          multiple
        />
      </RenderIf>
      <div className="flex flex-col gap-8">
        {localFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Uploading...</span>
            {localFiles.map(({ id: localId, file }) => (
              <UploadFileCard
                key={localId}
                file={file}
                store="remove-audio"
                onSuccess={(fileId) => handleUploadFile(localId, fileId, file.name)}
              />
            ))}
          </div>
        )}

        {pendingFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Uploaded</span>
            {pendingFiles.map((file) => (
              <DbFileCard
                {...file}
                key={file.id}
                store="remove-audio"
                onRemove={handleRemoveFile}
              />
            ))}
          </div>
        )}

        {processingFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Processing</span>
            {processingFiles.map((file) => (
              <DbFileCard
                {...file}
                processing
                key={file.id}
                store="remove-audio"
                onRemove={handleRemoveFile}
                onSuccess={handleProcessedFile}
                onError={handleFailedFile}
              />
            ))}
          </div>
        )}

        {processedFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Processed</span>
            {processedFiles.map((file) => (
              <DbFileCard
                {...file}
                processed
                key={`${file.id}-processed`}
                store="remove-audio"
                onRemove={handleRemoveFile}
              />
            ))}
          </div>
        )}

        {failedFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Failed</span>
            {failedFiles.map((file) => (
              <DbFileCard
                {...file}
                key={file.id}
                store="remove-audio"
                onRemove={handleRemoveFile}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
