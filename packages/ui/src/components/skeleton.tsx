import * as React from 'react';

import { cn } from './helpers';

function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-secondary', className)}
      {...props}
    />
  )
}

export { Skeleton }
