'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button, RenderIf } from '@bunpeg/ui';
import { ArrowLeftIcon, CloudUploadIcon } from 'lucide-react';
import { append } from '@bunpeg/helpers';

import { VIDEO_MIME_TYPES } from '@/utils/formats';
import { FileUploadCard } from '@/components/file-upload';
import FileCard from '@/components/file-card';

export default function ExtractAudio() {
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  const handleLocalFileUpload = (files: File[]) => {
    setLocalFiles((prev) => append(prev, ...files));
  }

  const hasFiles = localFiles.length > 0;

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
          <UploadButton onSuccess={handleLocalFileUpload} />
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
      <div className="flex flex-col gap-4">
        {localFiles.map((file, index) => <FileCard file={file} key={index} />)}
      </div>
    </section>
  );
}

interface UploadButtonProps {
  onSuccess: (files: File[]) => void;
}
function UploadButton(props: UploadButtonProps) {
  const { onSuccess } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const droppedFiles = Array.from(e.target.files);
    if (!droppedFiles.length) return;

    onSuccess(droppedFiles);
    clearFileInput();
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      // @ts-ignore
      fileInputRef.current.value = null;
    }
  }

  return (
    <>
      <Button variant="outline" onClick={openFilePicker}>
        <CloudUploadIcon className="size-4 mr-2" />
        Upload files
      </Button>
      <input ref={fileInputRef} multiple type="file" accept={VIDEO_MIME_TYPES.join((','))} className="hidden" onChange={handleChange} />
    </>
  );
}
