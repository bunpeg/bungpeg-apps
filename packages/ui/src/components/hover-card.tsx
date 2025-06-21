'use client'

import * as React from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'

import { cn } from './helpers';

const HoverCard = (props: React.ComponentProps<typeof HoverCardPrimitive.Root>) => <HoverCardPrimitive.Root {...props} />

const HoverCardTrigger = (props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) => <HoverCardPrimitive.Trigger {...props} />

const HoverCardContent = ({ className, align = 'center', sideOffset = 4, ...props }: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>) => (
  <HoverCardPrimitive.Content
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden animate-in zoom-in-90',
      className
    )}
    {...props}
  />
)
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
