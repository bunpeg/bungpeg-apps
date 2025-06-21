import { cn } from './helpers';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ className, children }: Props) {
  return (
    <kbd
      className={cn(
        'inline-flex justify-center items-center py-1 px-1.5 rounded-md font-mono text-xs',
        'bg-white border border-gray-200 text-gray-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)]',
        'dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:shadow-[0px_2px_0px_0px_rgba(255,255,255,0.1)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
