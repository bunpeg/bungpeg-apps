'use client';
import { useTheme } from 'next-themes';
import { MonitorCogIcon, MoonIcon, SunIcon } from 'lucide-react';

import { Button } from '@bunpeg/ui';

export default function DefaultThemeToggle() {
  const { theme, setTheme } = useTheme();

  const switchTheme = () => {
    switch (theme) {
      case 'system': {
        setTheme('light');
      } break;
      case 'light': {
        setTheme('dark');
      } break;
      case 'dark': {
        setTheme('system');
      } break;
    }
  };

  return (
    <div className="fixed top-2 right-4 z-50 pl-4 pb-2 flex items-center gap-0.5 bg-background">
      <Button size="sm" variant="ghost" className="block md:hidden" onClick={switchTheme}>
        {theme === 'system' && <MonitorCogIcon className="size-5" />}
        {theme === 'light' && <SunIcon className="size-5" />}
        {theme === 'dark' && <MoonIcon className="size-5" />}
      </Button>
      <Button size="xs" variant="ghost" className="hidden md:block" onClick={() => setTheme('system')}>
        <MonitorCogIcon data-on={theme === 'system'} className="size-4 data-[on=false]:text-neutral-400" />
      </Button>
      <Button size="xs" variant="ghost" className="hidden md:block" onClick={() => setTheme('light')}>
        <SunIcon data-on={theme === 'light'} className="size-4 data-[on=false]:text-neutral-400" />
      </Button>
      <Button size="xs" variant="ghost" className="hidden md:block" onClick={() => setTheme('dark')}>
        <MoonIcon data-on={theme === 'dark'} className="size-4 data-[on=false]:text-neutral-400" />
      </Button>
    </div>
  );
}
