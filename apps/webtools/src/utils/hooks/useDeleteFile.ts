import { useMutation, type MutationOptions } from '@tanstack/react-query';
import { toast } from '@bunpeg/ui';

import { env } from '@/env';

export default function useDeleteFile(options: MutationOptions<void, Error, string, unknown> = {}) {
  const mutation = useMutation<void, Error, string, unknown>({
    mutationFn: async (fileId) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/delete/${fileId}`, { method: 'DELETE' });

      if (!response.ok || response.status !== 200) {
        throw new Error(`File ID: ${fileId}`);
      }
    },
    onError: (err) => {
      toast.error('Failed to delete the file', { description: err.message });
    },
    ...options,
  });

  return mutation;
}
