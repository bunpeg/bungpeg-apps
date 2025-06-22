'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

export function SubNavBar(props: Props) {
  return (
    <header className="flex items-center gap-4 border rounded-lg bg-white p-2">
      <nav className="text-base font-medium flex flex-row items-center gap-6">
        {props.children}
      </nav>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  label: string;
}

export function NavLink(props: NavLinkProps) {
  const pathname = usePathname();
  return (
    <Link
      href={props.to}
      data-active={pathname.startsWith(props.to)}
      className="py-2 px-2 text-muted-foreground data-[active=true]:text-foreground data-[active=true]:rounded-lg data-[active=true]:bg-gray-100 transition-colors hover:text-foreground"
    >
      {props.label}
    </Link>
  );

}
