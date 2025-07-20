'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, Loader, RenderIf, toast } from '@bunpeg/ui';
import { ArrowLeftIcon, CpuIcon } from 'lucide-react';
import { append, applyWhere, remove, tryCatch } from '@bunpeg/helpers';
import { nanoid } from 'nanoid';
import { useMutation } from '@tanstack/react-query';

import { env } from '@/env';
import { type StoredFile } from '@/types';
import { markFileAsProcessing, retrieveFiles } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';
import UploadButton from '@/components/upload-button';
import { DbFileCard, UploadFileCard } from '@/components/file-card';

export default function TranscodePage() {
  const [localFiles, setLocalFiles] = useState<{ id: string; file: File }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<StoredFile[]>([]);

  const { mutate: process } = useMutation<void, Error, string>({
    mutationFn: async (format) => {
      const pendingFiles = uploadedFiles.filter((f) => f.status === 'pending');

      if (pendingFiles.length === 0) {
        toast('No files left to process');
        return;
      }

      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/bulk`, {
          method: 'POST',
          body: JSON.stringify({
            file_ids: pendingFiles.map(f => f.id),
            operation: {
              type: 'transcode',
              format,
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
        markFileAsProcessing('transcode', file.id);
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
    const storedFiles = retrieveFiles('transcode');
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
          <h1 className="text-2xl">Change formats</h1>
          <span className="text-muted-foreground text-sm">
            Upload the source files you want to change the format to
          </span>
        </div>
        <RenderIf condition={hasFiles}>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isProcessing}>
                <Button variant="outline">
                  {
                    isProcessing
                      ? <Loader size="icon" color="primary" className="mr-2" />
                      : <CpuIcon className="size-4 mr-2" />
                  }
                  Process
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Formats</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => process('mp4')}>
                    .mp4
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => process('webm')}>
                    .webm
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => process('mkv')}>
                    .mkv
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => process('avi')}>
                    .avi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => process('mov')}>
                    .mov
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {hasFiles ? (
        <div className="flex flex-col border-t border-r border-l">
          {localFiles.length > 0 && (
            <div className="flex flex-col">
              <span className="p-4">Uploading...</span>
              <div className="h-5 w-full stripped-bg border-t border-b" />
              {localFiles.map(({ id: localId, file }, index, list) => (
                <Fragment key={localId}>
                  <UploadFileCard
                    file={file}
                    store="transcode"
                    onSuccess={(fileId) => handleUploadFile(localId, fileId, file.name)}
                  />
                  {index !== list.length - 1 && <div className="h-5 w-full stripped-bg border-t border-b" />}
                </Fragment>
              ))}
              <div className="h-5 w-full stripped-bg border-t border-b" />
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="flex flex-col">
              <span className="p-4">Uploaded</span>
              <div className="h-5 w-full stripped-bg border-t border-b" />
              {pendingFiles.map((file, index, list) => (
                <Fragment key={file.id}>
                  <DbFileCard
                    {...file}
                    store="transcode"
                    onRemove={handleRemoveFile}
                  />
                  {index !== list.length - 1 && <div className="h-5 w-full stripped-bg border-t border-b" />}
                </Fragment>
              ))}
              <div className="h-5 w-full stripped-bg border-t border-b" />
            </div>
          )}

          {processingFiles.length > 0 && (
            <div className="flex flex-col">
              <span className="p-4">Processing</span>
              <div className="h-5 w-full stripped-bg border-t border-b" />
              {processingFiles.map((file, index, list) => (
                <Fragment key={file.id}>
                  <DbFileCard
                    {...file}
                    processing
                    store="transcode"
                    onRemove={handleRemoveFile}
                    onSuccess={handleProcessedFile}
                    onError={handleFailedFile}
                  />
                  {index !== list.length - 1 && <div className="h-5 w-full stripped-bg border-t border-b" />}
                </Fragment>
              ))}
              <div className="h-5 w-full stripped-bg border-t border-b" />
            </div>
          )}

          {processedFiles.length > 0 && (
            <div className="flex flex-col">
              <span className="p-4">Processed</span>
              <div className="h-5 w-full stripped-bg border-t border-b" />
              {processedFiles.map((file, index, list) => (
                <Fragment key={`${file.id}-processed`}>
                  <DbFileCard
                    {...file}
                    processed
                    store="transcode"
                    onRemove={handleRemoveFile}
                  />
                  {index !== list.length - 1 && <div className="h-5 w-full stripped-bg border-t border-b" />}
                </Fragment>
              ))}
              <div className="h-5 w-full stripped-bg border-t border-b" />
            </div>
          )}

          {failedFiles.length > 0 && (
            <div className="flex flex-col">
              <span className="p-4">Failed</span>
              <div className="h-5 w-full stripped-bg border-t border-b" />
              {failedFiles.map((file, index, list) => (
                <Fragment key={file.id}>
                  <DbFileCard
                    {...file}
                    store="transcode"
                    onRemove={handleRemoveFile}
                  />
                  {index !== list.length - 1 && <div className="h-5 w-full stripped-bg border-t border-b" />}
                </Fragment>
              ))}
              <div className="h-5 w-full stripped-bg border-t border-b" />
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
