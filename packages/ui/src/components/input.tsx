/* eslint-disable max-len */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './helpers';

const inputVariants = cva(
  'flex h-10 w-full bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 ease-linear',
  {
    variants: {
      variant: {
        default: 'rounded-md border border-neutral-300 hover:border-neutral-900 dark:border-slate-500 ring-offset-background focus-visible:hover:border-neutral-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        undecorated: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type InputProps = React.ComponentProps<'input'> & VariantProps<typeof inputVariants>;

const Input = ({ className, variant, type, ...props }: InputProps) => {
  return (
    <input
      type={type}
      className={cn(
        inputVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}
Input.displayName = 'Input'

export { Input }
