'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, RenderIf } from '@bunpeg/ui';
import { ArrowLeftIcon, CpuIcon } from 'lucide-react';
import { append, remove } from '@bunpeg/helpers';
import { nanoid } from 'nanoid';

import { VIDEO_MIME_TYPES } from '@/utils/formats';
import FileUploadCard from '@/components/file-upload';
import UploadButton from '@/components/upload-button';
import { DbFileCard, UploadFileCard } from '@/components/file-card';
import { retrieveFiles } from '@/utils/file-store';

export default function ExtractAudio() {
  const [localFiles, setLocalFiles] = useState<{ id: string; file: File }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string }[]>([]);

  const handleLocalFileUpload = (files: File[]) => {
    const newFiles = files.map((f) => ({ id: nanoid(8), file: f }))
    setLocalFiles((prev) => append(prev, ...newFiles));
  }

  const handleUploadFile = (localId: string, fileId: string, name: string) => {
    setLocalFiles((prev) => {
      const index = prev.findIndex(x => x.id === localId);
      if (index === -1) return prev; // safety check
      return remove(prev, index);
    });
    setUploadedFiles((prev) => append(prev, { id: fileId, name }));
  }

  useEffect(() => {
    const storedFiles = retrieveFiles('extract-audio');
    if (uploadedFiles.length === 0 && storedFiles.length > 0) {
      setUploadedFiles(storedFiles);
    }
  }, [])

  const hasFiles = localFiles.length > 0 || uploadedFiles.length > 0;

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
            <Button variant="outline">
              <CpuIcon className="size-4 mr-2" />
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
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-4">
            <span>Uploaded</span>
            {uploadedFiles.map((file) => <DbFileCard key={file.id} {...file} store="extract-audio" />)}
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
