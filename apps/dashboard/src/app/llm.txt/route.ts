import { docs, getLLMText } from '@/utils/docs';

// cached forever
export const revalidate = false;

export async function GET() {
  const scan = docs.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);
  return new Response(scanned.join('\n\n'));
}
