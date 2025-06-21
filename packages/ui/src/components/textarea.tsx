/* eslint-disable max-len */
import * as React from 'react';

import { cn } from './helpers';

export type TextareaProps = React.ComponentProps<'textarea'>

const Textarea = ({ className, ...props }: TextareaProps) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-neutral-300 dark:border-slate-500 hover:border-neutral-900 bg-transparent px-3 py-2 text-sm',
        'ring-offset-background placeholder:text-muted-foreground',
        'focus-visible:hover:border-neutral-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
Textarea.displayName = 'Textarea'

export { Textarea }
