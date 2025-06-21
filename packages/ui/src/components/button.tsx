import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './helpers';

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-white transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300',
  {
    variants: {
      variant: {
        default: 'bg-primary text-neutral-50 hover:bg-primary/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90',
        black: 'bg-neutral-800 text-white',
        destructive: 'bg-red-500 text-neutral-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90',
        'destructive-outline': 'border border-red-500 text-red-500 hover:border-red-500/90 dark:border-red-900 dark:text-red-900 dark:hover:border-red-900/90',
        'brand-outline': 'border border-primary text-primary hover:border-primary/90 hover:text-primary/90 dark:border-orange-600 dark:text-orange-600 dark:hover:border-orange-600/90',
        outline: 'border text-primary border-neutral-300 hover:border-neutral-900 dark:border-primary dark:hover:bg-neutral-50/10 dark:hover:border-primary',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80',
        ghost: 'hover:bg-secondary hover:text-neutral-900 dark:hover:text-neutral-50',
        link: 'text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50',
        undecorated: '',
      },
      size: {
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        sm: 'h-9 px-3',
        xs: 'h-6 px-1.5 text-xs',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonProps =
  React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> &
  { asChild?: boolean };

const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
Button.displayName = 'Button'

export { Button, buttonVariants }
