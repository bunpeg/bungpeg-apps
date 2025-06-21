import { cn } from './helpers';

interface Props {
  children: any;
  className?: string;
  highlight?: boolean;
}

function Code(props: Props) {
  const { children, highlight, className } = props;
  return (
    <code data-highlight={!!highlight} className={cn('relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm bg-neutral-100 data-[highlight=true]:bg-orange-600 data-[highlight=true]:text-white', className)}>
      {children}
    </code>
  );
}

export { Code };
