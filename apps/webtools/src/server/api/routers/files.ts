import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { env } from '@/env';

interface UserFile {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  metadata?: string;
}

export const files = createTRPCRouter({
  list: publicProcedure
    .query(async () => {
      const response = await fetch(`${env.BUNPEG_API}/files`);
      const data = await response.json();
      return (data as { files: UserFile[] }).files;
    }),
});
