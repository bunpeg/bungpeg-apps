'use client';

import { useState } from 'react';
import { SwatchBookIcon } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from './helpers';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  popoverClassName?: string;
  className?: string;
  modal?: boolean;
  disablePopup?: boolean;
}

const ColorPicker = (props: ColorPickerProps) => {
  const { value, onChange, modal, disablePopup, className, popoverClassName } = props;
  const [open, setOpen] = useState(false);

  const handleOpen = (__open: boolean) => {
    if (disablePopup) return;
    setOpen(__open);
  };

  const handleColorChange = (color: string) => {
    onChange(color);
    setOpen(false);
  }

  return (
    <Popover modal={modal} open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal border-input dark:border-slate-300 px-3',
            !value && 'text-muted-foreground',
            disablePopup && 'cursor-not-allowed opacity-50',
            className,
          )}
        >
          {!value ? <SwatchBookIcon className="mr-2 h-4 w-4" /> : null}
          {value ? (
            <div className="flex items-center gap-4">
              <div className={cn('w-4 h-4 min-w-4 min-h-4 rounded-full', colorsMap[value])}/>
              <span>{value}</span>
            </div>
          ) : <span>Pick a color</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto p-4 pointer-events-auto max-h-[420px] overflow-y-auto', popoverClassName)}>
        <RadioGroup value={value} onValueChange={handleColorChange} className="grid grid-cols-4 gap-4">
          {colorNames.map((colorName) => (
            <div key={colorName}>
              <RadioGroupItem value={colorName} id={colorName} className="peer sr-only"/>
              <Label
                htmlFor={colorName}
                className="flex flex-col gap-2 items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground hover:cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className={cn('h-6 w-6 rounded-full', colorsMap[colorName])} />
                <span className="text-sm">{colorName}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
};

const colorsMap: Record<string, string> = {
  'Red': 'bg-red-300',
  'Orange': 'bg-orange-300',
  'Amber': 'bg-amber-300',
  'Yellow': 'bg-yellow-300',
  'Lime': 'bg-lime-300',
  'Green': 'bg-green-300',
  'Emerald': 'bg-emerald-300',
  'Teal': 'bg-teal-300',
  'Cyan': 'bg-cyan-300',
  'Sky': 'bg-sky-300',
  'Blue': 'bg-blue-300',
  'Indigo': 'bg-indigo-300',
  'Violet': 'bg-violet-300',
  'Purple': 'bg-purple-300',
  'Fuchsia': 'bg-fuchsia-300',
  'Pink': 'bg-pink-300',
  'Rose': 'bg-rose-300',
};

const lightColorsMap: Record<string, string> = {
  'Red': 'bg-red-100',
  'Orange': 'bg-orange-100',
  'Amber': 'bg-amber-100',
  'Yellow': 'bg-yellow-100',
  'Lime': 'bg-lime-100',
  'Green': 'bg-green-100',
  'Emerald': 'bg-emerald-100',
  'Teal': 'bg-teal-100',
  'Cyan': 'bg-cyan-100',
  'Sky': 'bg-sky-100',
  'Blue': 'bg-blue-100',
  'Indigo': 'bg-indigo-100',
  'Violet': 'bg-violet-100',
  'Purple': 'bg-purple-100',
  'Fuchsia': 'bg-fuchsia-100',
  'Pink': 'bg-pink-100',
  'Rose': 'bg-rose-100',
};

const colorNames = Object.keys(colorsMap);

export { ColorPicker, colorsMap, lightColorsMap, type ColorPickerProps };
