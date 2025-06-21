import type { ReactNode } from 'react';
import { FileCode2Icon } from 'lucide-react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { docs } from '@/utils/docs';
import DynamicThemeToggle from '@/components/dynamic-theme-toggle';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={docs.pageTree}
      themeSwitch={{ enabled: false }}
      nav={{ transparentMode: 'none', title: 'Bunpeg' }}
      links={[
        {
          icon: <FileCode2Icon className="size-4" />,
          text: 'OpenAPI',
          url: 'https://api.bunpeg.io',
          secondary: false,
        },
      ]}
      githubUrl="https://github.com/bunpeg/bunpeg"
    >
      <DynamicThemeToggle />
      {children}
    </DocsLayout>
  );
}
