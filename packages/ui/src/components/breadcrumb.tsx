import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from './helpers';

const Breadcrumb = ({ ...props }: React.ComponentProps<'nav'> & {
  separator?: React.ReactNode;
}) => <nav aria-label="breadcrumb" {...props} />
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ol
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-gray-500 sm:gap-2.5 dark:text-gray-400',
      className
    )}
    {...props}
  />
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = ({ asChild, className, ...props }: React.ComponentProps<'a'> & {
  asChild?: boolean;
}) => {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      className={cn('transition-colors hover:text-gray-950 dark:hover:text-gray-50', className)}
      {...props}
    />
  )
}
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('font-normal text-gray-950 dark:text-gray-50', className)}
    {...props}
  />
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = 'BreadcrumbElipssis'

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
