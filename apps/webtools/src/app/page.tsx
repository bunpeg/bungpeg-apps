import Link from 'next/link';
import { FingerprintIcon, GithubIcon, PencilIcon, ServerOffIcon, Settings2Icon, SparklesIcon } from 'lucide-react';
import { Button } from '@bunpeg/ui';

import DynamicThemeToggle from '@/components/dynamic-theme-toggle';

export default async function Home() {
  return (
    <section className="py-12 md:py-20">
      <DynamicThemeToggle />
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center text-center space-y-12">
          <h2 className="text-balance text-4xl font-medium lg:text-6xl ">Bunpeg webtools</h2>
          <p>
            These are a collection of tools based on Bunpeg to manipulate video & audio.
          </p>
          <div className="hidden md:flex items-center gap-2">
            <a href="https://bunpeg.io/docs" target="_blank" rel="noopener noreferrer">
              <Button variant="default">Read the docs</Button>
            </a>
            <Link href="https://github.com/bunpeg/bunpeg" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <GithubIcon className="size-4 mr-2" />
                Check the repo
              </Button>
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <span className="text-muted-foreground">
              This website does not currently support mobile view.
            </span>
          </div>
        </div>
        <div className="relative mx-auto grid gap-4 md:gap-1 max-w-4xl *:p-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3 border">
            <div className="flex items-center gap-2">
              <ServerOffIcon className="size-4" />
              <h3 className="text-sm font-medium">Extract</h3>
            </div>
            <p className="text-sm">You can now use FFmpeg from any serverless environment.</p>
          </div>

          <div className="space-y-2 border relative">
            <div className="flex items-center gap-2">
              <Settings2Icon className="size-4" />
              <h3 className="text-sm font-medium">Control</h3>
            </div>
            <p className="text-sm">All operations run sequentially in a queue.</p>
          </div>

          <div className="space-y-2 border relative">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4" />
              <h3 className="text-sm font-medium">Docs for AI</h3>
            </div>
            <p className="text-sm">You can download and feed our docs to our AI of choice.</p>
          </div>

          <div className="space-y-2 border relative">
            <div className="flex items-center gap-2">
              <FingerprintIcon className="size-4" />
              <h3 className="text-sm font-medium">Security</h3>
            </div>
            <p className="text-sm">It supports an helping developers businesses.</p>
            <sub className="pl-10 absolute bottom-4 left-0">(placeholder)</sub>
          </div>

          <div className="space-y-2 border relative">
            <div className="flex items-center gap-2">
              <PencilIcon className="size-4" />
              <h3 className="text-sm font-medium">Customization</h3>
            </div>
            <p className="text-sm">It supports helping developers and businesses innovate.</p>
            <sub className="pl-10 absolute bottom-4 left-0">(placeholder)</sub>
          </div>

          <div className="space-y-2 border relative">
            <div className="flex items-center gap-2">
              <Settings2Icon className="size-4" />
              <h3 className="text-sm font-medium">Control</h3>
            </div>
            <p className="text-sm">It supports helping developers and businesses innovate.</p>
            <sub className="pl-10 absolute bottom-4 left-0">(placeholder)</sub>
          </div>
        </div>
      </div>
    </section>
  )
}
