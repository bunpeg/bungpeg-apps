
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react';

import { cn } from './helpers';
import { RenderIf } from './render-if';

const Dialog = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const body = document.body;
      const scrollLocked = body.dataset.scrollLocked;

      if (scrollLocked) {
        setTimeout(() => {
          body.style.pointerEvents = 'auto';
        }, 0);
      }
    }

    props.onOpenChange?.(open);
  };
  return (
    <DialogPrimitive.Root {...props} onOpenChange={handleOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
};

const DialogTrigger = (props: React.ComponentProps<typeof DialogPrimitive.Trigger>) => <DialogPrimitive.Trigger {...props} />;

const DialogPortal = (props: React.ComponentProps<typeof DialogPrimitive.Portal>) => <DialogPrimitive.Portal {...props} />;
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
)
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = ({ className, centered = true, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { centered?: boolean }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed z-50 w-full border bg-background px-6 pb-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg',
        { 'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]': centered },
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  hideClose,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hideClose?: boolean }) => (
  <div
    className={cn('flex items-start gap-4 pt-6 z-1', className)}
    {...props}
  >
    <div className="flex flex-col gap-1.5 text-left mb-4">
      {children}
    </div>

    <RenderIf condition={!hideClose}>
      <DialogPrimitive.Close className="ml-auto rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <XIcon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </RenderIf>
  </div>
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-row justify-end items-center gap-4',
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn(
      'text-md font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
);
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
