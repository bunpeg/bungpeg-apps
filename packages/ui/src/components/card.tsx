import * as React from 'react'

import { cn } from './helpers';

const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-lg border border-neutral-200 bg-white text-gray-950 shadow-xs',
      className
    )}
    {...props}
  />
)
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
)
CardHeader.displayName = 'CardHeader'

const CardTitle = ({ className, ...props }: React.ComponentProps<'h3'>) => (
  <h3
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
)
CardTitle.displayName = 'CardTitle'

const CardDescription = ({ className, ...props }: React.ComponentProps<'p'>) => (
  <p
    className={cn('text-sm text-muted-foreground font-medium dark:text-gray-400', className)}
    {...props}
  />
)
CardDescription.displayName = 'CardDescription'

const CardContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
)
CardContent.displayName = 'CardContent'

const CardFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
