'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Loader, RenderIf, toast } from '@bunpeg/ui';
import { ArrowLeftIcon, CpuIcon } from 'lucide-react';
import { append, remove, tryCatch } from '@bunpeg/helpers';
import { nanoid } from 'nanoid';
import { useMutation } from '@tanstack/react-query';

import { env } from '@/env';
import { retrieveFiles } from '@/utils/file-store';
import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';
import UploadButton from '@/components/upload-button';
import { DbFileCard, UploadFileCard } from '@/components/file-card';

export default function ExtractAudio() {
  const [localFiles, setLocalFiles] = useState<{ id: string; file: File }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; processing: boolean }[]>([]);
  const [processedFiles, setProcessedFiles] = useState<{ id: string; name: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutate: process } = useMutation({
    mutationFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/bulk`, {
          method: 'POST',
          body: JSON.stringify({
            fileIds: uploadedFiles.map(f => f.id),
            operation: {
              type: 'extract-audio',
              audioFormat: 'mp3',
            },
          })
        })
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        const error = await response.text();
        throw new Error(error ?? `Something went wrong with the server`);
      }

      setIsProcessing(true);
    },
    onError: (err) => {
      toast.error('Failed to start processing files', { description: err.message });
      setIsProcessing(false);
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
    setUploadedFiles((prev) => append(prev, { id: fileId, name, processing: false }));
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const fileIndex = prev.findIndex((f) => f.id === id);
      if (fileIndex === -1) return prev;
      return remove(prev, fileIndex);
    })
  }

  const handleProcessedFile = (id: string, name: string) => {
    setUploadedFiles((prev) => {
      const fileIndex = prev.findIndex(f => f.id === id);
      if (fileIndex === -1) return prev;
      return remove(prev, fileIndex);
    });
    setProcessedFiles((prev) => append(prev, ({ id, name })));
  }

  useEffect(() => {
    const storedFiles = retrieveFiles('extract-audio');
    if (uploadedFiles.length === 0 && storedFiles.length > 0) {
      const __processingFiles = storedFiles
        .filter(x => x.status === 'pending')
        .map((f) => ({ id: f.id, name: f.name, processing: false }));

      const __processedFiles = storedFiles
        .filter(x => x.status === 'processed')
        .map((f) => ({ id: f.id, name: f.name }));

      setUploadedFiles(__processingFiles);
      setProcessedFiles(__processedFiles);
    }
    // this is only meant to run once on start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasFiles = localFiles.length > 0 || uploadedFiles.length > 0 || processedFiles.length > 0;

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
          <h1 className="text-2xl">Extract audio</h1>
          <span className="text-muted-foreground text-sm">
            Upload the source files you want to get the audio from
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
        {processedFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Processed</span>
            {processedFiles.map((file) => (
              <DbFileCard
                key={file.id}
                {...file}
                store="extract-audio"
                onRemove={handleRemoveFile}
                onSuccess={(fileId) => handleProcessedFile(fileId, file.name)}
                processing={false}
                processed
              />
            ))}
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Uploaded</span>
            {uploadedFiles.map((file) => (
              <DbFileCard
                key={file.id}
                {...file}
                store="extract-audio"
                processing={isProcessing}
                onRemove={handleRemoveFile}
                onSuccess={(fileId) => handleProcessedFile(fileId, file.name)}
              />
            ))}
          </div>
        )}

        {localFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Uploading...</span>
            {localFiles.map(({ id: localId, file }) => (
              <UploadFileCard
                key={localId}
                file={file}
                store="extract-audio"
                onSuccess={(fileId) => handleUploadFile(localId, fileId, file.name)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
