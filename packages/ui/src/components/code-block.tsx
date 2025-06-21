/* eslint-disable max-len */
'use client'
import { useState } from 'react';
import { ClipboardIcon } from 'lucide-react';

import { Button } from './button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip';
import { cn } from './helpers';

interface Props {
  children: any;
  className?: string;
}

type States = 'IDLE' | 'COPIED' | 'ERROR' | 'NOT_SUPPORTED';

export function CodeBlock(props: Props) {
  const { children, className } = props;

  const [tooltipState, setTooltipState] = useState<States>('IDLE');

  const copy = (valueToCopy: any) => {
    if ('clipboard' in navigator) {
      navigator.clipboard
        .writeText(valueToCopy)
        .then(() => setTooltipState('COPIED'))
        .catch(() => setTooltipState('ERROR'));
    } else {
      setTooltipState('NOT_SUPPORTED');
    }
    setTimeout(() => setTooltipState('IDLE'), 2000);
  };

  const getTooltipMessage = () => {
    switch (tooltipState) {
      case 'COPIED':
        return 'Copied';
      case 'ERROR':
        return 'Something went wrong';
      case 'NOT_SUPPORTED':
        return 'Not supported';
      default:
        return 'Copy';
    }
  }

  return (
    <div className={cn('flex relative rounded-sm bg-slate-50 dark:bg-slate-900 group', className)}>
      <code className="w-full text text-sm font-mono whitespace-break-spaces py-5 px-4 overflow-auto">
        {children}
      </code>
      <TooltipProvider>
        <Tooltip disableHoverableContent open={tooltipState !== 'IDLE'}>
          <TooltipTrigger>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 w-7 p-0 absolute top-2 right-2 invisible group-hover:visible"
              onClick={() => copy(children)}
            >
              <ClipboardIcon size={16} className="text-slate-600 dark:text-slate-200" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {getTooltipMessage()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
