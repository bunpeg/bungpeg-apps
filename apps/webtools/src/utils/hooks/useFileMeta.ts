import { type DefinedInitialDataOptions, useQuery } from '@tanstack/react-query';
import { tryCatch } from '@bunpeg/helpers';

import { env } from '@/env';
import { type VideoMeta } from '@/types';

export default function useFileMeta(id: string, options: Partial<DefinedInitialDataOptions<VideoMeta, Error, VideoMeta, any>> = {}) {
  const query = useQuery<VideoMeta>({
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
    throwOnError: false,
    refetchOnWindowFocus: false,
    ...options,
  });

  return query;
}
