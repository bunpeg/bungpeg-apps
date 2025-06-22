'use client';

import type React from 'react';
import { useRef, useState } from 'react';
import { FilesIcon } from 'lucide-react';
import { Button, cn } from '@bunpeg/ui';

import { ALLOWED_FORMATS, ALLOWED_MIME_TYPES } from '@/utils/formats';

interface Props {
  multiple?: boolean;
  onSuccess: (files: File[]) => void;
}

export function FileUploadCard(props: Props) {
  const { multiple, onSuccess } = props;
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (!droppedFiles.length) return;
    onSuccess(droppedFiles);
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const droppedFiles = Array.from(e.target.files);
    if (!droppedFiles.length) return;

    onSuccess(droppedFiles);
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed p-8 transition-colors border-muted-foreground/25 hover:border-primary/50',
        { 'border-primary bg-primary/5': isDragging }
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple={multiple}
        onChange={handleFileInput}
        accept={ALLOWED_MIME_TYPES.join(',')}
      />

      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <FilesIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Drag & Drop your files here</h3>
          <p className="text-sm text-muted-foreground mt-1">Accepts video & audio files</p>
        </div>
        <Button onClick={openFileDialog} variant="outline" className="mt-2">
          Select Files
        </Button>
      </div>
    </div>
  )
}

export function validateFileType (file: File): boolean {
  const fileType = file.type
  const fileName = file.name
  const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

  return (
    ALLOWED_MIME_TYPES.includes(fileType) ||
    ALLOWED_FORMATS.some((ext) => fileExtension === ext.toLowerCase())
  )
}
