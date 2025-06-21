import type { ReactNode } from 'react';

import { cn } from './helpers';

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

const Timeline = (props: TimelineProps) => {
  const { children, className } = props;
  return (
    <div className={cn('px-4 py-4', className)}>
      <div className="pl-8 border-l flex flex-col gap-6 border-gray-200">
        {children}
      </div>
    </div>
  )
}

const TimeLineEvent = (props: TimelineProps) => {
  const { children, className } = props;

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[-40px] mt-1">
        <div className="bg-neutral-700 w-4 h-4 rounded-full border-4 border-white" />
      </div>
      {children}
    </div>
  );
};

const TimelineEventTitle = (props: TimelineProps) => <h3 className={cn('font-semibold text-lg mb-1', props.className)}>{props.children}</h3>

const TimelineEventDescription = (props: TimelineProps) => <p className={cn('text-sm text-gray-600 mb-1', props.className)}>{props.children}</p>

const TimelineEventDate = (props: TimelineProps) => <time className={cn('text-xs text-gray-600', props.className)}>{props.children}</time>

export { Timeline, TimeLineEvent, TimelineEventTitle, TimelineEventDescription, TimelineEventDate };
