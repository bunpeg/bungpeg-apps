import { useRef } from 'react';
import { Button } from '@bunpeg/ui';
import { CloudUploadIcon } from 'lucide-react';

interface Props {
  multiple?: boolean;
  accept: string[];
  onSuccess: (files: File[]) => void;
}
export default function UploadButton(props: Props) {
  const { multiple, accept, onSuccess } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const droppedFiles = Array.from(e.target.files);
    if (!droppedFiles.length) return;

    onSuccess(droppedFiles);
    clearFileInput();
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      // @ts-ignore
      fileInputRef.current.value = null;
    }
  }

  return (
    <>
      <Button size="icon" variant="outline" onClick={openFilePicker}>
        <CloudUploadIcon className="size-4" />
      </Button>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        multiple={multiple}
        onChange={handleChange}
        accept={accept.join(',')}
      />
    </>
  );
}
