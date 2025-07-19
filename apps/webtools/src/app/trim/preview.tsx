'use client'

import dynamic from 'next/dynamic';
import { Button, RenderIf } from '@bunpeg/ui';
import { CloudDownloadIcon, FileVideoIcon, Loader, Trash2Icon } from 'lucide-react';

import { env } from '@/env';
import useFile from '@/utils/hooks/useFile';
import useFileMeta from '@/utils/hooks/useFileMeta';
import { type StoredFile } from '@/types';

import Wrapper from './wrapper';

const DynamicDashVideoPlayer = dynamic(() => import('./dash-player'), { ssr: false });

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
          <FileVideoIcon className="size-5 mt-1" />
          <div className="flex flex-col gap-1">
            <span>{fileName}</span>
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
          <FileVideoIcon className="size-5 mt-1" />
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
        <span>Failed to load file or video URL</span>
      </Wrapper>
    );
  }

  const meta = metadata ?? file?.metadata ?? null;
  const duration = meta?.duration ? Number(meta.duration) : 0;

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
              Dowload
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
      <div className="flex flex-col gap-4 border-t pt-4">
        {/* Uploaded File Info */}
        <div className="flex flex-col">
          <span className="tex-sm">{file.file_name}</span>
          <span className="text-sm text-gray-500">
            ID: {file.id}
            {meta ? (
              <>
                | size: {(meta.size / 1024 / 1024).toFixed(2)}MB |
                duration: {duration.toFixed(2)}s
              </>
            ) : null}
          </span>
        </div>

        <DynamicDashVideoPlayer controls src={buildCdnUrl(fileId)} className="max-h-[calc(100vh_-_200px)]" />
      </div>
    </Wrapper>
  );
}

function buildCdnUrl(fileId: string) {
  // https://bunpeg.fra1.cdn.digitaloceanspaces.com/:file_id/dash/manifesto.mpd
  return `https://bunpeg.fra1.cdn.digitaloceanspaces.com/${fileId}/dash/manifesto.mpd`;
}
