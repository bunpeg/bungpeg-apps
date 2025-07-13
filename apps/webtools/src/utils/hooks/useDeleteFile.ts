import { useMutation } from '@tanstack/react-query';
import { toast } from '@bunpeg/ui';

import { env } from '@/env';

import { removeFile } from '../file-store';

export default function useDeleteFile(id: string, onSuccess: () => void) {
  const mutation = useMutation<void, Error, string, unknown>({
    mutationFn: async () => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/delete/${id}`, { method: 'DELETE' });

      if (!response.ok || response.status !== 200) {
        throw new Error('Unable to delete the file');
      }
    },
    onSuccess: async () => {
      removeFile('trim', id);
      onSuccess();
    },
    onError: (err) => {
      toast.error('Failed to delete the file', { description: err.message });
    },
  });

  return mutation;
}
