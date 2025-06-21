'use client'
import dynamic from 'next/dynamic';

const DefaultThemeToggle = dynamic(() => import('@/components/default-theme-toggle'), { ssr: false });

export default function DynamicThemeToggle() {
  return (
    <DefaultThemeToggle />
  )
}
