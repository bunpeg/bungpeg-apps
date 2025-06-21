/* eslint-disable max-len */
'use client'
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from './helpers';

const Slider = ({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) => (
  <SliderPrimitive.Root
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-400">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
);

const RangeSlider = ({ className, defaultValue, value, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) => {
  const resolveThumbs = () => {
    const hasDefaultValue = Array.isArray(defaultValue);
    const hasValue = Array.isArray(value);

    if (hasValue) {
      return value.map((_v, i) => (
        <SliderPrimitive.Thumb key={i} className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      ));
    }

    if (hasDefaultValue) {
      return defaultValue.map((_v, i) => (
        <SliderPrimitive.Thumb key={i} className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      ));
    }

    return <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />;
  };

  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      defaultValue={defaultValue}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-400">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {resolveThumbs()}
    </SliderPrimitive.Root>
  )
};

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider, RangeSlider }
