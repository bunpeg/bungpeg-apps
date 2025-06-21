/* eslint-disable max-len */
'use client'
import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from './helpers';

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = 'Drawer'

const DrawerTrigger = (props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) => <DrawerPrimitive.Trigger {...props} />

const DrawerPortal = (props: React.ComponentProps<typeof DrawerPrimitive.Portal>) => <DrawerPrimitive.Portal {...props} />

const DrawerClose = (props: React.ComponentProps<typeof DrawerPrimitive.Close>) => <DrawerPrimitive.Close {...props} />

const DrawerOverlay = ({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) => (
  <DrawerPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
    {...props}
  />
)
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = ({ className, children, direction = 'bottom', ...props }: React.ComponentProps<typeof DrawerPrimitive.Content> & { direction?: React.ComponentProps<typeof DrawerPrimitive.Root>['direction'] }) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      className={cn(
        'fixed z-50 flex h-auto flex-col border bg-background',
        {
          'inset-x-0 top-0 border-t-0 rounded-b-[10px] mb-24': direction === 'top',
          'inset-x-0 bottom-0 border-b-0 rounded-t-[10px] mt-24': direction === 'bottom',
          'inset-y-0 left-0 border-l-0 mr-24 w-5/6': direction === 'left',
          'inset-y-0 right-0 border-r-0 ml-24 w-5/6': direction === 'right',
        },
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
)
DrawerContent.displayName = 'DrawerContent'

const DrawerHeader = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = ({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) => (
  <DrawerPrimitive.Title
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
)
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = ({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) => (
  <DrawerPrimitive.Description
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
)
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
