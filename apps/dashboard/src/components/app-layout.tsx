import type { Session } from 'next-auth';

import NavBar from '@/components/nav-bar';

interface Props {
  session: Session;
	children: React.ReactNode;
}

export function AppLayout(props: Props) {
  return (
    <section className="flex min-h-screen w-full flex-col bg-neutral-50">
      <NavBar session={props.session} />
      <div className="flex flex-col sm:gap-4 pb-20 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 md:p-4 md:gap-8">
	        {props.children}
        </main>
      </div>
    </section>
  );
}
