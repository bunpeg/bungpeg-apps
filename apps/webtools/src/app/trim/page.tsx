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
    <>
      <RenderIf condition={!uploadedFile}>
        <Uploader onSuccess={(info) => setUploadedFile({ ...info, status: 'pending' })} />
      </RenderIf>

      {uploadedFile ? <Editor file={uploadedFile} onRemove={() => setUploadedFile(null)} /> : null}
    </>
  );
}
