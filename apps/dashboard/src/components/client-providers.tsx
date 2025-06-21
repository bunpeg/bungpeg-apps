'use client'

import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { TRPCReactProvider } from '@/trpc/react';

interface Props {
  session: Session | null;
  children: any;
}

export default function ClientProviders({ children, session }: Props) {
  return (
    <TRPCReactProvider>
      {/*<SessionProvider session={session}>*/}
        {children}
      {/*</SessionProvider>*/}
    </TRPCReactProvider>
  );
}
