import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { env } from '@/env';

export interface Task {
  id: string;
  file_id: string;
  operation: 'transcode' | 'trim' | 'cut-end' | 'extract-audio';
  args: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'unreachable';
  pid?: number;
  error?: string;
}

export const tasks = createTRPCRouter({
  list: publicProcedure
    .query(async () => {
      const response = await fetch(`${env.BUNPEG_API}/tasks`);
      const data = await response.json();
      return (data as { tasks: Task[] }).tasks;
    }),
});
