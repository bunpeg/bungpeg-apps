// .source folder will be generated when you run `next dev`
import { loader, type InferPageType } from 'fumadocs-core/source';
import { remarkInclude } from 'fumadocs-mdx/config';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { icons } from 'lucide-react';
import { createElement } from 'react';

import { docs as __docs } from '../../.source';

export const docs = loader({
  baseUrl: '/docs',
  source: __docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      // You may set a default icon
      return;
    }
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

const processor = remark()
  .use(remarkMdx)
  .use(remarkInclude) // needed for Fumadocs MDX
  .use(remarkGfm);

export async function getLLMText(page: InferPageType<typeof docs>) {
  const processed = await processor.process({
    path: page.data._file.absolutePath,
    value: page.data.content,
  });
  return `# ${page.data.title}\n${page.data.description} \nURL: ${page.url}\n${processed.value}`;
}
