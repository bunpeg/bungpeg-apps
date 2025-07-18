'use client';

import { useEffect, useState } from 'react';
import { tryCatch } from '@bunpeg/helpers';

import type { StoredFile } from '@/types';
import { removeFile, retrieveFiles } from '@/utils/file-store';
import useDeleteFile from '@/utils/hooks/useDeleteFile';

import Editor from './editor';
import Uploader from './uploader';
import Preview from './preview';

export default function TrimPage() {
  const [uploadedFile, setUploadedFile] = useState<StoredFile | null>(null);
  const [processedFile, setProcessedFile] = useState<StoredFile | null>(null);
  const [view, setView] = useState<'upload' | 'process' | 'preview'>('upload');

  const { mutateAsync: deleteFile, isPending: isDeleting } = useDeleteFile();

  const handleDelete = async () => {
    if (!uploadedFile) return;
    const { error } = await tryCatch(deleteFile(uploadedFile.id));

    if (error) {
      console.error('Error deleting file:', error);
      return;
    }

    removeFile('trim', uploadedFile.id);
    setUploadedFile(null);
    setProcessedFile(null);
  };

  useEffect(() => {
    const storedFiles = retrieveFiles('trim');
    if (!uploadedFile && storedFiles.length > 0) {
      const __uploadedFile = storedFiles.find(file => file.status === 'pending');
      if (__uploadedFile) {
        setUploadedFile(__uploadedFile);
      }

      const __processedFile = storedFiles.find(file => file.status === 'processed');
      if (__processedFile) {
        setProcessedFile(__processedFile);
      }
    }
    // this is only meant to run once on start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProcessed = (mergedFileId: string) => {
    if (!uploadedFile) return;
    setProcessedFile({ ...uploadedFile, id: mergedFileId, status: 'processed' });
    setView('preview');
  }

  const renderView = () => {
    if (view === 'preview' && processedFile) {
      return <Preview file={processedFile} isDeleting={isDeleting} onRemove={handleDelete} />;
    }

    if (view === 'upload' && uploadedFile) {
      return <Editor file={uploadedFile} onProcessed={handleProcessed} isDeleting={isDeleting} onRemove={handleDelete} />;
    }

    return <Uploader onSuccess={(info) => setUploadedFile({ ...info, status: 'pending' })} />;
  };

  return <>{renderView()}</>;
}
