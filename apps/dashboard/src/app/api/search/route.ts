import { createFromSource } from 'fumadocs-core/search/server';

import { docs } from '@/utils/docs';

export const { GET } = createFromSource(docs);
