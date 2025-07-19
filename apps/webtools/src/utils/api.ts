import { poll, tryCatch } from '@bunpeg/helpers';

import { env } from '@/env';

export async function pollFileStatus(fileId: string) {
  const pollRes = await poll(() => checkFileStatus(fileId), 1000);

  if (!pollRes.success) {
    throw new Error(`Failed to process the file ${fileId}`);
  }

  return pollRes;
}

const checkFileStatus = async (fileId: string) => {
  const { data: statusRes, error: statusErr } = await tryCatch(fetch(`${env.NEXT_PUBLIC_BUNPEG_API}/status/${fileId}`));

  if (statusErr) return { success: false };

  const status = (await statusRes.json()).status;

  if (status === 'processing') throw new Error('File processing pending');

  return { success: status === 'completed' };
};

export function buildCdnUrl(fileId: string) {
  // https://bunpeg.fra1.cdn.digitaloceanspaces.com/:file_id/dash/manifesto.mpd
  // https://bunpeg.fra1.cdn.digitaloceanspaces.com/rEjWHOj9/dash/manifesto.mpd - bad one
  // https://bunpeg.fra1.cdn.digitaloceanspaces.com/bunpeg/rEjWHOj9/dash/manifesto.mpd - good one
  return `https://bunpeg.fra1.cdn.digitaloceanspaces.com/${fileId}/dash/manifesto.mpd`;
}
