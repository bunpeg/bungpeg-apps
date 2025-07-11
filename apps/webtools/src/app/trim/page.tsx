'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, RenderIf } from '@bunpeg/ui';
import { ArrowLeftIcon } from 'lucide-react';

import type { StoredFile } from '@/types';
import { retrieveFiles } from '@/utils/file-store';

import Uploader from './uploader';
import Editor from './editor';

export default function TrimPage() {
  const [uploadedFile, setUploadedFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    const storedFiles = retrieveFiles('trim');
    if (!uploadedFile && storedFiles.length > 0) {
      setUploadedFile(storedFiles[0]!);
    }
    // this is only meant to run once on start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <RenderIf condition={!uploadedFile}>
        <Uploader onSuccess={(info) => setUploadedFile({ ...info, status: 'pending' })} />
      </RenderIf>

      {uploadedFile ? <Editor file={uploadedFile} onRemove={() => setUploadedFile(null)} /> : null}
    </section>
  );
}
