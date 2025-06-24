'use client'

import { useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Loader, toast,
} from '@bunpeg/ui';
import { CloudDownloadIcon, EllipsisVerticalIcon, ExternalLinkIcon, FileVideoIcon, Trash2Icon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { tryCatch } from '@bunpeg/helpers';

import { env } from '@/env';
import { appendFile, removeFile, type FileStore } from '@/utils/file-store';

interface UserFile {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  metadata?: string | null;
  created_at: string;
}

interface FileCardProps {
  id?: string;
  file?: File;
  store: FileStore;
}
export default function FileCard(props: FileCardProps) {
  const { id: __id, file, store } = props;
  const [id, setId] = useState<string | null>(__id ?? null);

  if (!id && !file) return null;

  if (!id && file) {
    return <UploadFileCard file={file} onSuccess={setId} store={store} />
  }

  return <DbFileCard id={id!} name={file!.name} store={store} />;
}

interface UploadFileCardProps {
  file: File;
  store: FileStore;
  onSuccess: (fileId: string) => void;
}
export function UploadFileCard(props: UploadFileCardProps) {
  const { file, store, onSuccess } = props;
  const [uploaded, setUploaded] = useState(false);

  const { mutate: upload, isPending, isError: mutationFailed, error: mutationError } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/upload`, {
          method: 'POST',
          body: formData,
        })
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
          <span className="text-xs text-red-500">
            {mutationError.message}
          </span>
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
}
export function DbFileCard(props: DbFileCardProps) {
  const { id, name, store } = props;

  const { data: file, error } = useQuery({
    queryKey: ['file', id],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files/${id}`)
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${id} does not exist.`);
      }

      const data = await response.json();
      return (data.file) as UserFile;
    },
    throwOnError: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: meta, isLoading } = useQuery({
    queryKey: ['file', id, 'meta'],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/meta/${id}`)
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${id} does not exist.`);
      }

      const data = await response.json();
      return data.meta;
    },
    throwOnError: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { mutate: deleteFile, isPending: isDeleting } = useMutation<void, Error, string, unknown>({
    mutationFn: async (fileId) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/delete/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to delete the file');
      }
    },
    onSuccess: async () => {
      // after(async () => {
      //   removeFile(store, id);
      // })
      removeFile(store, id);
    },
    onError: (err) => {
      toast.error('Failed to delete the file', { description: err.message });
    }
  })

  if (error) {
    return (
      <div className="border flex gap-2 p-4">
        <FileVideoIcon className="size-5 mt-1" />
        <div className="flex flex-col gap-1">
          <span>{name}</span>
          <span className="text-xs text-red-500">
            {error.message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border flex gap-2 p-4">
      <FileVideoIcon className="size-5 mt-1" />
      <div className="flex flex-col gap-1">
        <span>{file?.file_name ?? name}</span>
        <span className="text-xs text-muted-foreground">
          ID: {id} <Stats metadata={meta ?? null} />
        </span>
      </div>
      {isLoading && <Loader size="icon" color="primary" className="ml-auto" />}
      {!isLoading && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs" className="ml-auto">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <a href={`${env.NEXT_PUBLIC_BUNPEG_API}/output/${id}`} target="_blank">
              <DropdownMenuItem>
                <ExternalLinkIcon className="size-4 mr-2" />
                Preview
              </DropdownMenuItem>
            </a>
            <a href={`${env.NEXT_PUBLIC_BUNPEG_API}/download/${id}`} target="_blank">
              <DropdownMenuItem>
                <CloudDownloadIcon className="size-4 mr-2" />
                Download
              </DropdownMenuItem>
            </a>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => deleteFile(id)} disabled={isDeleting}>
              <Trash2Icon className="size-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

type VideoMeta = {
  size: number;
  duration: number | null;
  bitrate: number | null;
  resolution: {
    width: number | null;
    height: number | null;
  }
}
function Stats({ metadata }: { metadata: unknown | null }) {
  if (!metadata) return null;
  const meta = metadata as VideoMeta;
  const segments = [];

  if (meta.size) {
    segments.push(`size: ${(meta.size / 1024 / 1024).toFixed(2)} MB`);
  }

  if (meta.duration) {
    segments.push(`duration: ${meta.duration.toFixed(2)} s`);
  }

  if (meta.resolution?.width && meta.resolution?.height) {
    segments.push(`res: ${meta.resolution.width}x${meta.resolution.height}`);
  }

  const jointSegments = segments.join(' | ');
  return <>| {jointSegments}</>;
}
