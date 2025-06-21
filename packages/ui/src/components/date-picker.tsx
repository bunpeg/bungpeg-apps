'use client';

import { useState } from 'react';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { cn } from './helpers';
import { Button } from './button';
import { Calendar, type CalendarProps } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DatePickerProps extends Omit<CalendarProps, 'mode' | 'selected' | 'onSelect'>{
  date: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  modal?: boolean;
  disablePopup?: boolean;
  shortDate?: boolean;
}

export function DatePicker(props: DatePickerProps) {
  const { date, onChange, className, modal, disablePopup, shortDate, ...calendarProps } = props;
  const [open, setOpen] = useState(false);

  const handleOpen = (__open: boolean) => {
    if (disablePopup) return;
    setOpen(__open);
  };

  return (
    <Popover modal={modal} open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal border-input dark:border-slate-500 px-3',
            !date && 'text-muted-foreground',
            disablePopup && 'cursor-not-allowed opacity-50',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? format(date, shortDate ? 'dd MMM yyyy' : 'dd MMMM yyyy') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto">
        <Calendar
          initialFocus
          mode="single"
          {...calendarProps}
          selected={date}
          onSelect={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerWithRangeProps extends Omit<CalendarProps, 'mode' | 'selected' | 'onSelect'> {
  dates: DateRange;
  onChange: (dates: DateRange | undefined) => void;
  className?: string;
  showOptions?: boolean;
}

export function DatePickerWithRange(props: DatePickerWithRangeProps) {
  const { dates, onChange, className, showOptions, ...calendarProps } = props;

  return (
    <div className={cn('grid', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'justify-start text-left font-normal',
              !dates && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dates?.from ? (
              dates.to ? (
                <>
                  {format(dates.from, 'LLL dd, y')} -{' '}
                  {format(dates.to, 'LLL dd, y')}
                </>
              ) : (
                format(dates.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto flex items-stretch gap-2" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dates?.from}
            selected={dates}
            onSelect={onChange}
            numberOfMonths={2}
            {...calendarProps}
          />
          {showOptions ? (
            <div className="border-l bg-neutral-50/50 p-4 flex flex-col gap-4">
              {OPTIONS.map((op, index) => (
                <Button key={index} variant="outline" className="bg-white" onClick={() => onChange(op.generate())}>
                  {op.label}
                </Button>
              ))}
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}

const OPTIONS: { label: string; generate: () => DateRange }[] = [
  { label: 'This week', generate: selectThisWeek },
  { label: 'Past week', generate: selectPastWeek },
  { label: 'This month', generate: selectThisMonth },
  { label: 'Last month', generate: selectPastMonth },
];

function selectThisWeek() {
  const today = new Date();
  const __startOfWeek = startOfWeek(today, { weekStartsOn: 1 });
  const __endOfWeek = endOfWeek(today, { weekStartsOn: 1 });

  return { from: __startOfWeek, to: __endOfWeek };
}

function selectPastWeek() {
  const today = new Date();
  const __startOfWeek = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
  const __endOfWeek = subWeeks(endOfWeek(today, { weekStartsOn: 1 }), 1);

  return { from: __startOfWeek, to: __endOfWeek };
}

function selectThisMonth() {
  const today = new Date();
  const __startOfMonth = startOfMonth(today);
  const __endOfMonth = endOfMonth(today);

  return { from: __startOfMonth, to: __endOfMonth };
}

function selectPastMonth() {
  const today = new Date();
  const __startOfMonth = subMonths(startOfMonth(today), 1);
  const __endOfMonth = subMonths(endOfMonth(today), 1);

  return { from: __startOfMonth, to: __endOfMonth };
}

