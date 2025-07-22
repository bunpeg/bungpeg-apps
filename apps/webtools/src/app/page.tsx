import Link from 'next/link';
import {
  ExpandIcon,
  FileAudioIcon,
  ImagePlusIcon,
  ScissorsLineDashedIcon,
  Settings2Icon,
  VolumeOffIcon,
} from 'lucide-react';
import { Button, RenderIf, Separator } from '@bunpeg/ui';
import { GitHubIcon } from '@bunpeg/ui/icons';

import ViewSizeGuard from '@/components/view-size-guard';

export default async function Home() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center text-center space-y-12 mb-10">
          <h2 className="text-balance text-4xl font-medium md:text-6xl ">Bunpeg webtools</h2>
          <p>
            These are a collection of tools based on Bunpeg to manipulate video & audio.
          </p>
        </div>

        <ViewSizeGuard>
          <div data-el="tools" className="relative mx-auto stripped-bg border p-4 grid gap-4 md:gap-4 max-w-4xl sm:grid-cols-2 lg:grid-cols-3">
            <Toolbox link="/trim" title="Trim" description="Trim video files lengths" icon={<ScissorsLineDashedIcon className="size-4" />} />
            <Toolbox link="/scale" title="Scale" description="Change the scale & aspect ration of video files" icon={<ExpandIcon className="size-4" />} />
            <Toolbox link="/transcode" title="Change formats" description="Transcode video files to other formats" icon={<Settings2Icon className="size-4" />} />
            <Toolbox link="/extract-audio" title="Extract audio" description="Extract the audio track from video files" icon={<FileAudioIcon className="size-4" />} />
            <Toolbox link="/remove-audio" title="Remove audio" description="Remove the audio track from video files" icon={<VolumeOffIcon className="size-4" />} />
            <Toolbox link="/extract-thumbnail" title="Extract thumbnail" description="Select and extract any frame as thumbnail" icon={<ImagePlusIcon className="size-4" />} />
          </div>
        </ViewSizeGuard>

        <footer className="mx-auto max-w-4xl flex justify-center items-center gap-2 mt-5">
          <a href="https://github.com/bunpeg/bunpeg" target="_blank" rel="noopener noreferrer">
            <Button variant="link">
              <GitHubIcon className="size-4 mr-2 text-current" />
              Github repo
            </Button>
          </a>
          <Separator orientation="vertical" className="h-5" />
          <a href="https://bunpeg.io" target="_blank" rel="noopener noreferrer">
            <Button variant="link">
              Built with Bunpeg
            </Button>
          </a>
        </footer>
      </div>
    </section>
  )
}

interface ToolboxProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
  comingSoon?: boolean;
}
function Toolbox(props: ToolboxProps) {
  const { icon, description, link, title, comingSoon } = props;
  return (
    <Link href={link ?? '/'} className="bg-background space-y-2 p-12 border relative cursor-pointer transition-colors ease-linear hover:border-primary dark:hover:border-primary">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="text-sm">{description}</p>
      <RenderIf condition={!!comingSoon}>
        <sub className="pl-10 absolute bottom-4 left-0">(coming soon...)</sub>
      </RenderIf>
    </Link>
  );
}
