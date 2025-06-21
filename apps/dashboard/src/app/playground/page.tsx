import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from '@bunpeg/ui';

import DynamicThemeToggle from '@/components/dynamic-theme-toggle';

import FilesList from './files-list';
import TasksList from './tasks-list';

export default async function Home() {
  return (
    <section className="w-screen h-screen flex flex-col pt-20 px-4">
      <DynamicThemeToggle />
      <div className="fixed top-0 left-0 z-50 flex items-center gap-0.5 bg-background">
        <Link href="/">
          <Button variant="link" className="group">
            <ArrowLeftIcon className="size-4 mr-2 group-hover:-translate-x-0.5 transition ease-linear" />
            Go Back
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">How it works</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-xl flex flex-col gap-5" align="start">
            <h3 className="font-semibold">Welcome!</h3>
            <p className="text-sm">
              This playground is not meant to be for production use, though it has
              all the capabilities of the actual service, you might loose the files you upload here
              when I clean them, as they will take up space. If you're interested in using the service,
              check the docs and use the endpoints. This platform does not have a dashboard or accounts yet
              but it's coming soon. Then you will be able to securely store & process your files.
            </p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div className="mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold  text-center">Files</h1>
          <FilesList />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold  text-center">Tasks</h1>
          <TasksList />
        </div>
      </div>
    </section>
  )
}
