'use client'

import { Button, RenderIf } from '@bunpeg/ui';
import { CloudDownloadIcon, ImageIcon, Loader, Trash2Icon } from 'lucide-react';

import { env } from '@/env';
import { type StoredFile } from '@/types';
import { buildCdnUrl } from '@/utils/api';
import useFile from '@/utils/hooks/useFile';
import useFileMeta from '@/utils/hooks/useFileMeta';

import Wrapper from './wrapper';

interface Props {
  file: StoredFile;
  isDeleting: boolean;
  onRemove: () => void;
}

export default function Preview(props: Props) {
  const { isDeleting, onRemove } = props;
  const fileId = props.file.id;
  const fileName = props.file.name;

  const { data: file, isLoading: isLoadingFileInfo, error: fileError } = useFile(fileId);

  const { data: metadata, isLoading: isLoadingMeta, error: metaError } = useFileMeta(fileId, {
    enabled: !!file && !file.metadata,
  })

  const error = fileError ?? metaError;

  if (isLoadingFileInfo || isLoadingMeta) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <ImageIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-muted-foreground">Loading thumbnail...</span>
          </div>
          <RenderIf condition={!error}>
            <Loader size="icon" color="primary" className="ml-auto" />
          </RenderIf>
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="border flex gap-2 p-4">
          <ImageIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
            <span className="text-xs text-red-500">{error.message}</span>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (!file) {
    return (
      <Wrapper>
        <span>Failed to load thumbnail file</span>
      </Wrapper>
    );
  }

  const meta = metadata ?? file?.metadata ?? null;
  const resolution = meta?.resolution;

  return (
    <Wrapper
      action={
        <div className="flex items-center gap-1">
          <a
            href={`${env.NEXT_PUBLIC_BUNPEG_API}/download/${fileId}`}
            target="_blank"
          >
            <Button variant="outline">
              <CloudDownloadIcon className="size-4 mr-2" />
              Download
            </Button>
          </a>
          <Button
            size="icon"
            variant="outline"
            className="ml-auto"
            onClick={onRemove}
            disabled={isDeleting}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col border">
        {/* File Info */}
        <div className="flex flex-col p-4">
          <span className="text-sm font-medium">{file.file_name}</span>
          <span className="text-sm text-gray-500">
            ID: {file.id}
            {meta ? (
              <>
                | Size: {(meta.size / 1024).toFixed(2)}KB
                {resolution?.width && resolution?.height ? (
                  <> | Dimensions: {resolution.width}x{resolution.height}</>
                ) : null}
              </>
            ) : null}
          </span>
        </div>

        <div className="h-5 w-full stripped-bg border-t border-b" />

        {/* Thumbnail Display */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="size-4" />
            <span className="text-sm font-medium">Extracted Thumbnail</span>
          </div>
          <div className="p-4 flex justify-center">
            <img
              src={`${env.NEXT_PUBLIC_BUNPEG_API}/output/${fileId}`}
              alt="Extracted thumbnail"
              className="max-w-full h-auto max-h-96 rounded border shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.appendChild(
                  Object.assign(document.createElement('div'), {
                    className: 'text-red-500 text-sm text-center p-4',
                    textContent: 'Failed to load thumbnail image'
                  })
                );
              }}
            />
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
