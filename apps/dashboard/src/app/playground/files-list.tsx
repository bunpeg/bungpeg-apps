'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronsRight,
  CloudDownloadIcon,
  CloudUploadIcon,
  CombineIcon,
  ExpandIcon,
  ExternalLinkIcon,
  FileAudioIcon,
  FileImageIcon,
  FilePlus2Icon,
  FileVideoIcon,
  ImagePlayIcon,
  ImagePlusIcon,
  ScissorsLineDashedIcon,
  ShrinkIcon,
  SquareDashedIcon,
  SquareIcon,
  TerminalIcon,
  Trash2Icon,
  VolumeOffIcon,
} from 'lucide-react';
import { type inferRouterOutputs } from '@trpc/server';
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Loader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  toast,
  validateFile,
} from '@bunpeg/ui';
import { append, remove } from '@bunpeg/helpers';

import { env } from '@/env';
import { api } from '@/trpc/react';
import { type AppRouter } from '@/server/api/root';

type UserFile = inferRouterOutputs<AppRouter>['files']['list'][0];

export default function FilesList() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UserFile[]>([]);

  const toggleSelection = () => {
    if (isSelecting) {
      setSelectedFiles([]);
      setIsSelecting(false);
    } else {
      setIsSelecting(true);
    }
  };

  const toggleFileSelection = (file: UserFile) => {
    const fileIndex = selectedFiles.findIndex((__file) => __file.id === file.id);

    if (fileIndex !== -1) {
      setSelectedFiles(remove(selectedFiles, fileIndex));
    } else {
      setSelectedFiles(append(selectedFiles, file));
    }
  }

  const isSelected = (file: UserFile) => {
    return selectedFiles.findIndex((__file) => __file.id === file.id) !== -1;
  }

  const utils = api.useUtils();
  const { data: files = [], isLoading } = api.files.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const onSuccess = () => {
    void utils.files.list.invalidate();
    void utils.tasks.list.invalidate();
  }

  const onError = (err: any) => {
    toast.error('Failed to create task', { description: err.message });
  }

  const { mutate: transcode, isPending: isTranscoding } = useMutation<void, Error, { fileId: string; format: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/transcode`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create transcode task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: resize, isPending: isResizing } = useMutation<void, Error, { fileId: string, width: number; height: number; outputFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/resize-video`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create resize-video task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: trim, isPending: isTrimming } = useMutation<void, Error, { fileId: string; start: number; duration: number; outputFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/trim`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create trim task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: cutEnd, isPending: isCutting } = useMutation<void, Error, { fileId: string; duration: number; outputFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/trim-end`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create trim-end task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: extractAudio, isPending: isExtractingAudio } = useMutation<void, Error, { fileId: string; audioFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/extract-audio`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create extract-audio task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: removeAudio, isPending: isRemovingAudio } = useMutation<void, Error, { fileId: string; outputFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/remove-audio`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create remove-audio task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: addAudio, isPending: isAddingAudio } = useMutation<void, Error, { videoFileId: string; audioFileId: string; outputFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/add-audio`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create add-audio task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: merge, isPending: isMerging } = useMutation<void, Error, { fileIds: string[]; outputFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/merge`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create add-audio task');
      }
    },
    onSuccess,
    onError,
    onSettled: toggleSelection,
  })

  const { mutate: chain, isPending: isChaining } = useMutation<void, Error, { fileId: string }, unknown>({
    mutationFn: async (params) => {
      const file = files.find((__file) => __file.id === params.fileId);
      if (!file) throw new Error('Unable to find file');

      const meta = file.metadata ? JSON.parse(file.metadata) : {};
      if (Number.isNaN(Number(meta.duration))) return;

      const parts = file.file_name.split('.');

      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/chain`, {
        method: 'POST',
        body: JSON.stringify({
          fileId: params.fileId,
          operations: [
            { type: 'trim', start: 0, duration: 200, outputFormat: parts.at(-1)! },
            { type: 'trim-end', duration: 50, outputFormat: parts.at(-1)! },
            { type: 'transcode', format: 'mkv' },
          ],
        }),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create trim-end task');
      }
    },
    onSuccess,
    onError
  })

  const { mutate: extractThumbnail, isPending: isExtracting } = useMutation<void, Error, { fileId: string; timestamp: string; imageFormat: string }, unknown>({
    mutationFn: async (params) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/extract-thumbnail`, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to create extract-thumbnail task');
      }
    },
    onSuccess,
    onError,
  })

  const { mutate: deleteFile, isPending: isDeleting } = useMutation<void, Error, string, unknown>({
    mutationFn: async (fileId) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/delete/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to delete the file');
      }
    },
    onSuccess,
    onError
  })

  const isPending =
    isDeleting ||
    isTranscoding ||
    isTrimming ||
    isCutting ||
    isChaining ||
    isExtractingAudio ||
    isRemovingAudio ||
    isAddingAudio ||
    isMerging ||
    isExtracting ||
    isResizing;

  const resolveFormat = (fileName: string) => {
    const parts = fileName.split('.');
    return parts.at(-1)!;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="h-20">
          <TableCell className="w-10">
            <Button size="xs" variant="ghost" className="px-1" title="Toggle selection of rows" onClick={toggleSelection}>
              {!isSelecting ? <SquareIcon className="size-4" /> : <SquareDashedIcon className="size-4" />}
              <span className="sr-only">selection toggle</span>
            </Button>
          </TableCell>
          <TableCell>File</TableCell>
          <TableCell className="w-24 text-center">
            {isSelecting ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isPending || selectedFiles.length < 2}>
                  <Button size="icon" variant="ghost">
                    <TerminalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={isPending}
                    onClick={() => {
                      addAudio({
                        videoFileId: selectedFiles[0]!.id,
                        audioFileId: selectedFiles[1]!.id,
                        outputFormat: resolveFormat(selectedFiles[0]!.file_name),
                      });
                    }}
                  >
                    <FilePlus2Icon className="size-4 mr-2" />
                    Add audio
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isPending}
                    onClick={() => {
                      merge({
                        fileIds: selectedFiles.map((f) => f.id),
                        outputFormat: resolveFormat(selectedFiles[0]!.file_name),
                      });
                    }}
                  >
                    <CombineIcon className="size-4 mr-2" />
                    Merge files
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : <UploadButton />}
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? <SkeletonRows /> : null}
        {!isLoading && files.length === 0 ? <EmptySpace /> : null}
        {files.map((file) => {
          const meta = file.metadata ? JSON.parse(file.metadata) : {};
          const width = meta.resolution?.width ? Number(meta.resolution?.width) : 1024;
          const height = meta.resolution?.height ? Number(meta.resolution?.height) : 768;
          const isVideo = file.mime_type.startsWith('video/');
          const isAudio = file.mime_type.startsWith('audio/');
          const isImage = file.mime_type.startsWith('image/');
          const currentFormat = resolveFormat(file.file_name);

          return (
            <TableRow key={file.id}>
              <TableCell className="text-center">
                {
                  isSelecting
                    ? <Checkbox checked={isSelected(file)} onCheckedChange={() => toggleFileSelection(file)} />
                    : (
                      <>
                        {isVideo && <FileVideoIcon className="size-5" /> }
                        {isAudio && <FileAudioIcon className="size-5" /> }
                        {isImage && <FileImageIcon className="size-5" /> }
                      </>
                    )
                }
              </TableCell>
              <TableCell>
                {file.file_name}
                <br />
                <Stats metadata={file.metadata ?? null} />
              </TableCell>
              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isPending}>
                    <Button size="icon" variant="ghost">
                      <TerminalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuLabel>ID: {file.id}</DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Transcode</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem disabled={isPending} onClick={() => transcode({ fileId: file.id, format: 'mp4' })}>
                            <ImagePlayIcon className="size-4 mr-2" />
                            To .mp4
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isPending} onClick={() => transcode({ fileId: file.id, format: 'mov' })}>
                            <ImagePlayIcon className="size-4 mr-2" />
                            To .mov
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isPending} onClick={() => transcode({ fileId: file.id, format: 'mkv' })}>
                            <ImagePlayIcon className="size-4 mr-2" />
                            To .mkv
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Trim</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => trim({ fileId: file.id, start: 0, duration: 10, outputFormat: currentFormat })}
                          >
                            <ScissorsLineDashedIcon className="size-4 mr-2" />
                            From start
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending || !file.metadata}
                            onClick={() => {
                              if (!file.metadata) return;

                              const meta = JSON.parse(file.metadata);
                              if (Number.isNaN(Number(meta.duration))) return;

                              const parts = file.file_name.split('.');
                              trim({
                                fileId: file.id,
                                start: 5,
                                duration: Number(meta.duration) - 5,
                                outputFormat: parts.at(-1)!,
                              });
                            }}
                          >
                            <ScissorsLineDashedIcon className="size-4 mr-2 rotate-180" />
                            From end (trim)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => {
                              if (Number.isNaN(Number(meta.duration))) return;

                              const parts = file.file_name.split('.');
                              cutEnd({
                                fileId: file.id,
                                duration: Number(meta.duration) - 5,
                                outputFormat: parts.at(-1)!,
                              });
                            }}
                          >
                            <ScissorsLineDashedIcon className="size-4 mr-2 rotate-180" />
                            From end (trim-end)
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Audio</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => extractAudio({ fileId: file.id, audioFormat: 'mp3' })}
                          >
                            <FileAudioIcon className="size-4 mr-2" />
                            Extract audio
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending || !file.metadata}
                            onClick={() => removeAudio({ fileId: file.id, outputFormat: currentFormat })}
                          >
                            <VolumeOffIcon className="size-4 mr-2" />
                            Remove audio
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Other</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => {
                              resize({
                                fileId: file.id,
                                width: width * 2,
                                height: height * 2,
                                outputFormat: currentFormat,
                              });
                            }}
                          >
                            <ExpandIcon className="size-4 mr-2" />
                            Scale up
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => {
                              resize({
                                fileId: file.id,
                                width: width / 2,
                                height: height / 2,
                                outputFormat: currentFormat,
                              });
                            }}
                          >
                            <ShrinkIcon className="size-4 mr-2" />
                            Scale down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled={isPending} onClick={() => chain({ fileId: file.id })}>
                            <ChevronsRight className="size-4 mr-2" />
                            Chain operations
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => {
                              extractThumbnail({ fileId: file.id, timestamp: '10', imageFormat: 'png' });
                            }}
                          >
                            <ImagePlusIcon className="size-4 mr-2" />
                            Extract thumbnail
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    <a href={`${env.NEXT_PUBLIC_BUNPEG_API}/output/${file.id}`} target="_blank">
                      <DropdownMenuItem disabled={isPending}>
                        <ExternalLinkIcon className="size-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                    </a>
                    <a href={`${env.NEXT_PUBLIC_BUNPEG_API}/download/${file.id}`} target="_blank">
                      <DropdownMenuItem disabled={isPending}>
                        <CloudDownloadIcon className="size-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    </a>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => deleteFile(file.id)} disabled={isPending}>
                      <Trash2Icon className="size-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function SkeletonRows() {
  return (
    <>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
    </TableRow>
  );
}

function EmptySpace() {
  return (
    <TableRow>
      <TableCell colSpan={3}>No files to show</TableCell>
    </TableRow>
  )
}

function UploadButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const files = event.target.files;

      if (files.length === 1) {
        const file = files[0]!;
        const { ok, error } = validateFile(file);

        if (!ok) {
          if (error === 'invalid') {
            toast('The file is not supported', {
              description: (
                <>
                  The file does not have a name or extension.
                  <br />
                  <br />
                  File: <span className="text-xs font-medium">{file.name}</span>
                </>
              ),
              duration: 5000,
            });
          }

          if (error === 'extension') {
            toast('The file is not supported', {
              description: (
                <>
                  The file needs to have an extension so it can be opened correctly later on.
                  <br />
                  <br />
                  File: <span className="text-xs font-medium">{file.name}</span>
                </>
              ),
              duration: 5000,
            });
          }

          if (error === 'system-file') {
            toast('The file is not supported', {
              description: (
                <>
                  You are trying to upload an operating system file.
                  <br />
                  <br />
                  File: <span className="text-xs font-medium">{file.name}</span>
                </>
              ),
              duration: 5000,
            });
          }

          if (error === 'max-size') {
            toast('File size is too big', {
              description: (
                <>
                  The size of the file is over our 500MB limit.
                  <br />
                  <br />
                  File: <span className="text-xs font-medium">{file.name}</span>
                </>
              ),
              duration: 5000,
            });
          }

          clearFileInput();
          return;
        }

        try {
          setLoading(true);
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/upload`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok && response.status >= 200) {
            const data = await response.json();
            toast('Upload completed', { description: `New file uploaded with ID: ${data.fileId}` });
            void utils.files.list.invalidate();
          } else {
            console.error(response);
            toast.error('Failed to upload file', { description: await response.text() });
          }
        } catch (e: any) {
          toast.error('Failed to upload file', { description: e.message });
        } finally {
          clearFileInput();
          setLoading(false);
        }
      }
    }
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      // @ts-ignore
      fileInputRef.current.value = null;
    }
  }

  return (
    <>
      <Button size="icon" onClick={openFilePicker} disabled={loading}>
        {loading ? <Loader size="xs" color="white" /> : <CloudUploadIcon className="size-4" />}
      </Button>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleChange} disabled={loading} />
    </>
  );
}

function Stats({ metadata }: { metadata: string | null }) {
  if (!metadata) return null;

  const meta = JSON.parse(metadata);

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
  return <> {jointSegments}</>;
}
