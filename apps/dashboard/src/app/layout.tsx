import { type Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { RootProvider } from 'fumadocs-ui/provider';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@bunpeg/ui';

import ClientProviders from '@/components/client-providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Bunpeg',
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
          <RootProvider>
            <ClientProviders session={null}>
              {children}
              <Toaster />
              {/*{process.env.NODE_ENV === 'development' && <ScreenSize />}*/}
            </ClientProviders>
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
