import { type DefinedInitialDataOptions, useQuery } from '@tanstack/react-query';
import { tryCatch } from '@bunpeg/helpers';

import { env } from '@/env';
import { type UserFile } from '@/types';

export default function useFile(id: string, options: Partial<DefinedInitialDataOptions<UserFile, Error, UserFile, any>> = {}) {
  const query = useQuery<UserFile>({
    queryKey: ['file', id],
    queryFn: async () => {
      const { data: response, error: reqError } = await tryCatch(
        fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/files/${id}`),
      );

      if (reqError) throw reqError;

      if (!response.ok || response.status === 400) {
        throw new Error(`File ${id} does not exist.`);
      }

      const data = await response.json();
      return data.file;
    },
    throwOnError: false,
    refetchOnWindowFocus: false,
    ...options,
  });

  return query;
}
