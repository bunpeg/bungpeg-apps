'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { CalendarDaysIcon, CookingPotIcon, LogOutIcon, ShoppingCartIcon, SoupIcon } from 'lucide-react';

import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@bunpeg/ui';

interface Props {
  session: Session;
}

export default function NavBar(props: Props) {
  const { session } = props;

  if (!session) {
    return null;
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-0 z-10 w-full md:w-14 py-2 md:py-0 flex flex-row md:flex-col border-t md:border-r border-neutral-200 bg-white dark:bg-gray-950">
      <nav className="flex md:flex-col justify-evenly md:justify-start items-center flex-1 gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Link
            className="hidden group md:flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 text-lg font-semibold text-gray-50 md:h-8 md:w-8 md:text-base dark:bg-gray-50 dark:text-gray-900"
            href="/intake"
          >
            <SoupIcon />
            <span className="sr-only">Meal Tracker</span>
          </Link>
          <NavItem href="/intake" icon={<CalendarDaysIcon className="h-7 md:h-5 w-7 md:w-5"/>} name="Intake records"/>
          <NavItem href="/meals" icon={<CookingPotIcon className="h-7 md:h-5 w-7 md:w-5"/>} name="Meals"/>
          <NavItem href="/groceries" icon={<ShoppingCartIcon className="h-7 md:h-5 w-7 md:w-5"/>} name="Groceries"/>
        </TooltipProvider>
      </nav>
      <nav className="mt-auto pb-4 hidden md:flex flex-col items-center justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => signOut({ callbackUrl: '/', redirect: true })}>
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}

function NavItem({ href, icon, name }: { href: string; icon: React.ReactNode; name: string }) {
  const pathname = usePathname();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          data-active={pathname.startsWith(href)}
          className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center text-gray-500 data-[active=true]:rounded-lg data-[active=true]:bg-gray-100 data-[active=true]:text-purple-900 transition-colors hover:text-gray-950"
          href={href}
        >
          {icon}
          <span className="sr-only">{name}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{name}</TooltipContent>
    </Tooltip>
  );
}
