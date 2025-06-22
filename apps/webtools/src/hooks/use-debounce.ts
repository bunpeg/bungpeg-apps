'use client'

import { useCallback, useRef } from 'react';

export function useDebounce(countDown: number) {
  const timerReference = useRef<number | undefined>(undefined);

  const debounceCall = useCallback((callback: () => void) => {
    if (timerReference.current) {
      clearTimeout(timerReference.current);
      timerReference.current = undefined;
    }
    timerReference.current = setTimeout(callback, countDown) as any;
  }, [countDown]);

  return { timer: timerReference.current, debounceCall };
}
