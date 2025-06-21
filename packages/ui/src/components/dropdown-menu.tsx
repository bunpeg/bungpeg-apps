'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRight, CircleIcon } from 'lucide-react';

import { cn } from './helpers';

const DropdownMenu = (props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) => <DropdownMenuPrimitive.Root {...props} />

const DropdownMenuTrigger = (props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) => <DropdownMenuPrimitive.Trigger {...props} />

const DropdownMenuGroup = (props: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) => <DropdownMenuPrimitive.Group {...props} />

const DropdownMenuPortal = (props: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) => <DropdownMenuPrimitive.Portal {...props} />

const DropdownMenuSub = (props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) => <DropdownMenuPrimitive.Sub {...props} />

const DropdownMenuRadioGroup = (props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) => <DropdownMenuPrimitive.RadioGroup {...props} />

const DropdownMenuSubTrigger = ({ className, inset, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) => (
  <DropdownMenuPrimitive.SubTrigger
    className={cn(
      'flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-hidden focus:bg-primary focus:text-background data-[state=open]:bg-primary data-[state=open]:text-background data-disabled:pointer-events-none data-disabled:cursor-default data-disabled:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
)
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = ({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) => (
  <DropdownMenuPrimitive.SubContent
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden border text-gray-950 border-gray-200 bg-white dark:bg-secondary dark:border-border dark:text-gray-50 p-1 ml-2 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
)
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = ({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] mt-2 overflow-hidden p-1 border border-gray-200 dark:border-border bg-white dark:bg-secondary text-gray-950 dark:text-gray-50 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = ({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
}) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'relative flex cursor-pointer select-none items-center px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-primary focus:text-background dark:focus:bg-primary dark:focus:text-background data-disabled:pointer-events-none data-disabled:cursor-default data-disabled:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = ({ className, children, checked, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) => (
  <DropdownMenuPrimitive.CheckboxItem
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-sm outline-hidden transition-colors focus:bg-gray-100 focus:text-gray-900 data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <div
      className={cn(
        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-orange-600',
        checked
          ? 'bg-orange-600 text-primary-foreground'
          : '[&_svg]:invisible'
      )}
    >
      <CheckIcon className={cn('h-4 w-4')}/>
    </div>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
)
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = ({ className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) => (
  <DropdownMenuPrimitive.RadioItem
    className={cn(
      'group relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-sm outline-hidden transition-colors focus:bg-gray-100 focus:text-gray-900 data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50',
      className
    )}
    {...props}
  >
    <CircleIcon className="h-2 w-2 mr-2 fill-current hidden group-data-[state=checked]:block" />
    <CircleIcon className="h-2 w-2 mr-2 group-data-[state=checked]:hidden" />
    {children}
  </DropdownMenuPrimitive.RadioItem>
)
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = ({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) => (
  <DropdownMenuPrimitive.Label
    className={cn(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) => (
  <DropdownMenuPrimitive.Separator
    className={cn('-mx-1 my-1 h-px bg-gray-100 dark:bg-primary/10', className)}
    {...props}
  />
)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
