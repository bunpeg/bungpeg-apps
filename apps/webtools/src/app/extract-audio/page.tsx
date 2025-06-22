'use client'

import { useState } from 'react';
import { ArrowLeftIcon, CloudUploadIcon, FileAudioIcon, FileImageIcon, FileVideoIcon } from 'lucide-react';
import { Button } from '@bunpeg/ui';

import { FileUploadCard } from '@/components/file-upload';

export default function ExtractAudio() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <section className="mx-auto max-w-4xl flex flex-col gap-10 py-10">
      <div>
        <Button variant="link" className="px-0">
          <ArrowLeftIcon className="size-4 mr-2" />
          Go back
        </Button>
      </div>
      <div className="flex justify-between py-6">
        <div>
          <h1 className="text-2xl">Extract audio</h1>
          <span className="text-muted-foreground text-sm">
            Upload the source files you want to get the audio from
          </span>
        </div>
        {files.length > 0 && (
          <Button variant="outline">
            <CloudUploadIcon className="size-4 mr-2" />
            Upload files
          </Button>
        )}
      </div>
      {files.length === 0 && (
        <FileUploadCard onSuccess={setFiles} multiple />
      )}
      <div className="flex flex-col gap-4">
        {files.map((file, index) => {
          const isVideo = file.type.startsWith('video/');
          const isAudio = file.type.startsWith('audio/');
          const isImage = file.type.startsWith('image/');

          return (
            <div key={index} className="border flex gap-2 p-4">
              {isVideo && <FileVideoIcon className="size-5 mt-1" /> }
              {isAudio && <FileAudioIcon className="size-5 mt-1" /> }
              {isImage && <FileImageIcon className="size-5 mt-1" /> }
              <div className="flex flex-col gap-1">
                <span>{file.name}</span>
                <span className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
