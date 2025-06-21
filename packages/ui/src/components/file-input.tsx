'use client'

import { useRef, useState } from 'react';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from './label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { InputWithLabel } from './input-with-label';
import { Code } from './code';
import { Loader } from './loader';

interface Props {
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  name?: string;
  accept?: string;
  allowClear?: boolean;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean | string;
  value?: string | null;
  onChange?: (files: File | null) => void;
}

export function FileInput(props: Props) {
  const {
    value,
    onChange,
    label,
    required,
    placeholder,
    hint,
    name,
    accept,
    allowClear = false,
    disabled = false,
    loading = false,
    error,
  } = props;
  const [showModal, setShowModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const __clearFileInput = () => {
    if (fileInputRef.current) {
      // @ts-ignore
      fileInputRef.current.value = null;
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length && onChange) {
      const nextFile = event.target.files[0];
      if (nextFile) {
        const { ok: isValid, error } = validateFile(nextFile);

        if (!isValid) {
          if (error === 'invalid') {
            toast('The file is not supported', {
              description: 'The file does not have a name or extension.',
              duration: 5000,
            });
          }

          if (error === 'extension') {
            toast('The file is not supported', {
              description: 'The file needs to have an extension so it can be opened correctly later on',
              duration: 5000,
            });
          }

          if (error === 'system-file') {
            toast('The file is not supported', {
              description: (
                <span className="text-sm">
                  You are trying to upload an operating system file (<Code>{'.<file_name>'}</Code>)
                </span>
              ),
              duration: 5000,
            });
          }

          // if (error === 'max-size') {
          //   toast('File size is too big', {
          //     description: 'File size should be up to 4.5MB',
          //     duration: 5000,
          //   });
          // }

          __clearFileInput();
          return;
        }

        fileRef.current = nextFile;
        setShowModal(true);
      }
    }
  };

  const removeFile = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    __clearFileInput();

    if (onChange) {
      onChange(null);
    }
  }

  const closeModal = () => {
    fileRef.current = null;
    __clearFileInput();
    setShowModal(false);
  }

  const uploadFile = (fileName: string) => {
    const __file = fileRef.current;

    if (!__file || !onChange) return;

    const renamedFile = new File([__file], fileName);
    onChange(renamedFile);
    setShowModal(false);
    fileRef.current = null;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}{required ? <sup className="ml-1">*</sup> : null}
        </span>
        <Label htmlFor={name} aria-disabled={disabled}>
          <div aria-disabled={disabled} aria-invalid={!!error}  className="w-full h-10 text-left flex items-stretch cursor-pointer border aria-[invalid=true]:border-red-500 rounded overflow-hidden hover:border-neutral-900 transition-all duration-150 ease-linear aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
            <div className="bg-neutral-300 text-neutral-950 flex items-center text-sm font-normal py-2.5 px-4 shrink-0">
              Choose file
            </div>
            <div className="flex items-center py-2.5 px-2 overflow-hidden flex-1">
              <span data-active={!!value} className="font-normal text-sm w-full overflow-hidden text-ellipsis whitespace-nowrap text-neutral-500 data-[active=true]:text-neutral-950">
                {value ?? placeholder ?? 'No file chosen'}
              </span>
            </div>
            {allowClear && value && !loading ? (
              <button
                type="button"
                onClick={removeFile}
                className="bg-neutral-200 text-white flex justify-center items-center px-2.5"
              >
                <Trash2Icon className="h-4 w-4 stroke-neutral-950" />
              </button>
            ) : null}
            {loading? (
              <div className="text-white flex justify-center items-center px-2.5">
                <Loader color="black" size="icon" />
              </div>
            ) : null}
          </div>
        </Label>
        <input
          type="file"
          id={name}
          name={name}
          accept={accept}
          ref={fileInputRef}
          onChange={handleChange}
          // required={required}
          // TODO: investigate how to make this work, currently it get the error: An invalid form control with name=<field_name> is not focusable.
          disabled={disabled}
          className="hidden"
        />
        {hint && !error ? <p className="text-xs font-medium text-muted-foreground">{hint}</p> : null}
        {!!error && typeof error === 'string' ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
      </div>
      {showModal && fileRef.current ? (
        <UploadDialog file={fileRef.current} onUpload={uploadFile} onClose={closeModal} />
      ) : null}
    </>
  );
}

interface UploadDialogProps {
  file: File;
  onClose: () => void;
  onUpload: (fileName: string) => void;
}

function UploadDialog(props: UploadDialogProps) {
  const { file, onClose, onUpload } = props;
  const [__fileName, extension] = splitFileName(file);
  const [fileName, setFileName] = useState<string>(__fileName);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue: string = event.target.value;
    setFileName(nextValue);

    if (nextValue === '') {
      setError('The file name can not be empty');
    } else if (error) {
      setError(undefined);
    }
  }

  const handleUpload = () => {
    if (error) return;
    onUpload(`${fileName}.${extension}`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload file</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col mt-6 gap-10">
          <div className="flex items-end gap-1">
            <InputWithLabel
              label="File name"
              className="flex-1"
              inputClassName="rounded-r-none"
              onChange={handleNameChange}
              value={fileName}
              error={error}
            />
            <div className="bg-neutral-100 h-10 rounded-r-md px-2 flex items-center text-sm cursor-default">.{extension}</div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function splitFileName(file: File | string): [string, string] {
  const parts: string[] = [];

  if (typeof file === 'string') {
    parts.push(...file.split('.'));
  } else {
    parts.push(...file.name.split('.'));
  }

  if (parts.length === 2) {
    return [parts[0]!, parts[1]!];
  }

  const fileName = parts.slice(0, -1).join('.');
  const extension = parts.at(-1)!;

  return [fileName, extension];
}

export function validateFile(file: File) {
  const [fileName, extension] = splitFileName(file);

  if (!fileName && !extension) {
    return { ok: false as const, error: 'invalid' as const }
  }

  if (!extension) {
    return { ok: false as const, error: 'extension' as const };
  }

  if (!fileName) {
    return { ok: false as const, error: 'system-file' as const };
  }

  // TODO: disabled for now
  // check file size to be less than 4.5MB
  // const maxSize = 4.5 * 1024 * 1024;
  // if (file.size > maxSize) {
  //   return { ok: false as const, error: 'max-size' as const };
  // }

  return { ok: true as const, error: null };
}
