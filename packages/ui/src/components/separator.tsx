'use client'

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from './helpers';

const Separator = ({ className, orientation = 'horizontal', decorative = true, ...props }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) => (
  <SeparatorPrimitive.Root
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] flex-1 min-h-[1px] max-h-[1px]' : 'w-[1px]',
      className
    )}
    {...props}
  />
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
