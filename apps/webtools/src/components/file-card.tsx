'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Loader,
  toast,
} from '@bunpeg/ui';
import {
  CloudDownloadIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  FileVideoIcon,
  Trash2Icon,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { tryCatch } from '@bunpeg/helpers';

import { env } from '@/env';
import {
  appendFile,
  markFileAsFailed,
  markFileAsProcessed,
  removeFile,
} from '@/utils/file-store';
import type { FileStore, UserFile, VideoMeta } from '@/types';

interface UploadFileCardProps {
  file: File;
  store: FileStore;
  onSuccess: (fileId: string) => void;
}
export function UploadFileCard(props: UploadFileCardProps) {
  const { file, store, onSuccess } = props;
  const [uploaded, setUploaded] = useState(false);

  const {
    mutate: upload,
    isPending,
    isError: mutationFailed,
    error: mutationError,
  } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/upload`, {
          method: 'POST',
          body: formData,
        }),
      );

      if (reqError) throw reqError;

      setUploaded(true);
      const res = await response.json();
      const fileId = res.fileId as string;
      appendFile(store, fileId, file.name);
      onSuccess(fileId);
    },
  });

  // this should only go in once
  if (!uploaded && !isPending && !mutationFailed) {
    upload();
  }

  return (
    <div className="border flex gap-2 p-4">
      <FileVideoIcon className="size-5 mt-1" />
      <div className="flex flex-col gap-1">
        <span>{file.name}</span>
        {!mutationFailed && (
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
        {mutationError && (
          <span className="text-xs text-red-500">{mutationError.message}</span>
        )}
      </div>
      <Loader size="icon" color="primary" className="ml-auto" />
    </div>
  );
}

interface DbFileCardProps {
  id: string;
  name: string;
  store: FileStore;
  processing?: boolean;
  processed?: boolean;
  onRemove: (id: string) => void;
  onSuccess?: (fileId: string) => void;
  onError?: (fileId: string) => void;
}
export function DbFileCard(props: DbFileCardProps) {
  const {
    id,
    name,
    store,
    processing = false,
    processed = false,
    onRemove,
    onSuccess,
    onError,
  } = props;

  const {
    data: file,
    isLoading: loadingFileInfo,
    error: fileError,
  } = useQuery({
    queryKey: processed ? ['file', id, 'processed'] : ['file', id],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files/${id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        onRemove(id);
        removeFile(store, id);
        throw new Error(`File ${id} does not exist.`);
      }

      const data = await response.json();
      return data.file as UserFile;
    },
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { data: meta, isLoading: isLoadingMeta } = useQuery({
    queryKey: ['file', id, 'meta'],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/meta/${id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${id} does not exist.`);
      }

      const data = await response.json();
      return data.meta;
    },
    enabled: !!file && !file.metadata,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  const { data: status } = useQuery({
    queryKey: ['file', id, 'status'],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/status/${id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${id} does not exist.`);
      }

      return (await response.json()) as {
        fileId: string;
        status: string;
        error: string | null;
      };
    },
    enabled: !!file && processing,
    refetchInterval: processing ? 1000 : undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { mutate: deleteFile, isPending: isDeleting } = useMutation<
    void,
    Error,
    string,
    unknown
  >({
    mutationFn: async (fileId) => {
      const response = await fetch(
        `${env.NEXT_PUBLIC_BUNPEG_API}/delete/${fileId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to delete the file');
      }
    },
    onSuccess: async () => {
      removeFile(store, id);
      onRemove(id);
    },
    onError: (err) => {
      toast.error('Failed to delete the file', { description: err.message });
    },
  });

  useEffect(() => {
    if (processing && status?.status === 'completed') {
      onSuccess?.(id);
      markFileAsProcessed(store, id);
    }

    if (processing && status?.status === 'failed') {
      onError?.(id);
      markFileAsFailed(store, id);
    }
    // the onSuccess function doesn't need to be a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, processing, id]);

  const metadata = file?.metadata ?? meta;
  const isLoading = loadingFileInfo || isLoadingMeta;
  const error = fileError?.message ?? status?.error;

  if (error) {
    return (
      <div className="border flex gap-2 p-4">
        <FileVideoIcon className="size-5 mt-1" />
        <div className="flex flex-col gap-1">
          <span>{name}</span>
          <span className="text-xs text-red-500">{error}</span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="ml-auto"
          onClick={() => deleteFile(id)}
          disabled={isDeleting}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border flex gap-2 p-4">
      <FileVideoIcon className="size-5 mt-1" />
      <div className="flex flex-col gap-1">
        <span>{file?.file_name ?? name}</span>
        <span className="text-xs text-muted-foreground">
          ID: {id} <Stats metadata={metadata ?? null} />
        </span>
      </div>
      {isLoading || processing ? (
        <Loader size="icon" color="primary" className="ml-auto" />
      ) : null}
      {!isLoading && !processing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs" className="ml-auto">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <a
              href={`${env.NEXT_PUBLIC_BUNPEG_API}/output/${id}`}
              target="_blank"
            >
              <DropdownMenuItem>
                <ExternalLinkIcon className="size-4 mr-2" />
                Preview
              </DropdownMenuItem>
            </a>
            <a
              href={`${env.NEXT_PUBLIC_BUNPEG_API}/download/${id}`}
              target="_blank"
            >
              <DropdownMenuItem>
                <CloudDownloadIcon className="size-4 mr-2" />
                Download
              </DropdownMenuItem>
            </a>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => deleteFile(id)}
              disabled={isDeleting}
            >
              <Trash2Icon className="size-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function Stats({ metadata }: { metadata: unknown | null }) {
  if (!metadata) return null;
  const meta = metadata as VideoMeta;
  const segments = [];

  if (meta.size) {
    segments.push(`size: ${(meta.size / 1024 / 1024).toFixed(2)}MB`);
  }

  if (meta.duration) {
    segments.push(`duration: ${meta.duration.toFixed(2)}s`);
  }

  if (meta.resolution?.width && meta.resolution?.height) {
    segments.push(`res: ${meta.resolution.width}x${meta.resolution.height}`);
  }

  const jointSegments = segments.join(' | ');
  return <>| {jointSegments}</>;
}
