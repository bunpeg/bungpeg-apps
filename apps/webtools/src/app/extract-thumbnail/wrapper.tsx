import Link from 'next/link';
import { Button } from '@bunpeg/ui';
import { ArrowLeftIcon } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function Wrapper(props: Props) {
  const { children, action } = props;

  return (
    <section className="mx-auto max-w-4xl px-4 flex flex-col gap-6 py-10">
      <div>
        <Link href="/">
          <Button variant="link" className="px-0">
            <ArrowLeftIcon className="size-4 mr-2" />
            Go back
          </Button>
        </Link>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Extract Thumbnail</h1>
          <span className="text-muted-foreground text-sm">
            Upload a video and extract any frame as a thumbnail image
          </span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
