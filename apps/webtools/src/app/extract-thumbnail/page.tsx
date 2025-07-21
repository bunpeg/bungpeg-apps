'use client';

import { useEffect, useState } from 'react';
import { tryCatch } from '@bunpeg/helpers';

import type { StoredFile } from '@/types';
import { removeFile, retrieveFiles } from '@/utils/file-store';
import useDeleteFile from '@/utils/hooks/useDeleteFile';

import Editor from './editor';
import Uploader from './uploader';
import Preview from './preview';

export default function ExtractThumbnailPage() {
  const [uploadedFile, setUploadedFile] = useState<StoredFile | null>(null);
  const [processedFile, setProcessedFile] = useState<StoredFile | null>(null);
  const [view, setView] = useState<'upload' | 'process' | 'preview'>('upload');

  const { mutateAsync: deleteFile, isPending: isDeleting } = useDeleteFile();

  useEffect(() => {
    const storedFiles = retrieveFiles('extract-thumbnail');
    if (!uploadedFile && storedFiles.length > 0) {
      const __uploadedFile = storedFiles.find(file => file.status === 'pending');
      if (__uploadedFile) {
        setUploadedFile(__uploadedFile);
        setView('process');
      }

      const __processedFile = storedFiles.find(file => file.status === 'processed');
      if (__processedFile) {
        setProcessedFile(__processedFile);
        setView('preview');
      }
    }
    // this is only meant to run once on start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = (info: { id: string; name: string }) => {
    setUploadedFile({ ...info, status: 'pending' });
    setView('process');
  };

  const handleProcessed = (thumbnailFileId: string) => {
    if (!uploadedFile) return;
    setProcessedFile({ ...uploadedFile, id: thumbnailFileId, status: 'processed' });
    setView('preview');
  }

  const handleDelete = async () => {
    if (!uploadedFile) return;
    const { error } = await tryCatch(deleteFile(uploadedFile.id));

    if (error) {
      console.error('Error deleting file:', error);
      return;
    }

    removeFile('extract-thumbnail', uploadedFile.id);
    if (processedFile) removeFile('extract-thumbnail', processedFile.id);

    setUploadedFile(null);
    setProcessedFile(null);
    setView('upload');
  };

  const renderView = () => {
    if (view === 'preview' && processedFile) {
      return <Preview file={processedFile} isDeleting={isDeleting} onRemove={handleDelete} />;
    }

    if (view === 'process' && uploadedFile) {
      return <Editor file={uploadedFile} onProcessed={handleProcessed} isDeleting={isDeleting} onRemove={handleDelete} />;
    }

    return <Uploader onSuccess={handleUpload} />;
  };

  return <>{renderView()}</>;
}
