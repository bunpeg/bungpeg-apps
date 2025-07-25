import { type Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@bunpeg/ui';

import ClientProviders from '@/components/client-providers';
import DynamicThemeToggle from '@/components/dynamic-theme-toggle';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Bunpeg Tools',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

const font = JetBrains_Mono({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className}`}>
        {process.env.NODE_ENV !== 'development' && <Analytics />}
        <ThemeProvider attribute="class" enableColorScheme>
          <DynamicThemeToggle />
          <ClientProviders session={null}>
            {children}
            <Toaster />
            {/*{process.env.NODE_ENV === 'development' && <ScreenSize />}*/}
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
