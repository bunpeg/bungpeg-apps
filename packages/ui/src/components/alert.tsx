
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './helpers';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-red-800 dark:border-red-500 bg-red-50 dark:bg-transparent text-red-800 dark:text-red-500 [&>svg]:text-red-800 dark:[&>svg]:text-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = ({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) => (
  <div
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
)
Alert.displayName = 'Alert'

const AlertTitle = ({ className, ref, ...props }: React.ComponentProps<'h5'>) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
