'use client';

import { useScreenSize } from '../hooks';

export const ScreenSize = () => {
  const { height, width } = useScreenSize();

  return (
    <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-black px-2.5 py-1 font-mono text-xs font-medium text-white">
      <span>
        {width.toLocaleString()} x {height.toLocaleString()}
      </span>
      <div className="h-4 w-px bg-gray-800" />
      <span className="sm:hidden">XS</span>
      <span className="hidden sm:inline md:hidden">SM</span>
      <span className="hidden md:inline lg:hidden">MD</span>
      <span className="hidden lg:inline xl:hidden">LG</span>
      <span className="hidden xl:inline 2xl:hidden">XL</span>
      <span className="hidden 2xl:inline">2XL</span>
    </div>
  );
};
