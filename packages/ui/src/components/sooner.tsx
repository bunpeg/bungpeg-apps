'use client'

import * as React from 'react';
import { Toaster as Sonner, toast as sonnerToast } from 'sonner';
import { type ReactNode } from 'react';
import { XIcon } from 'lucide-react';

import { Button } from './button';

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      richColors
      closeButton
      theme="light"
      position="bottom-right"
      visibleToasts={3}
      {...props}
    />
  );
};

interface ToastProps {
  id: string | number;
  title: ReactNode;
  description?: ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
}

/** I recommend abstracting the toast function
 *  so that you can call it without having to use `toast.custom` everytime. */
function toast(title: ReactNode, extras: Omit<ToastProps, 'id' | 'title'> = {}) {
  return sonnerToast.custom((id) => <Toast id={id} title={title} {...extras} />, { duration: extras?.duration });
}

toast.error = (title: ReactNode, extras: Omit<ToastProps, 'id' | 'title'>) => {
  return sonnerToast.custom((id) => <Toast id={id} title={title} {...extras} destructive />, { duration: extras?.duration });
};

/** A fully custom toast that still maintains the animations and interactions. */
function Toast(props: ToastProps & { destructive?: boolean }) {
  const { id, title, description, action, cancel, destructive } = props;

  return (
    <div className="flex flex-col p-4 gap-6 rounded-lg bg-white shadow-lg ring-1 ring-black/5 w-90 relative">
      <Button variant="ghost" size="xs" className="absolute h-5 w-5 p-0 top-1 right-1" onClick={() => sonnerToast.dismiss(id)}>
        <XIcon className="w-3 h-3" />
      </Button>
      <div className="flex flex-col gap-0.5">
        <p
          data-variant={destructive ? 'destructive' : 'neutral'}
          className="text-sm font-medium text-gray-900 data-[variant=destructive]:text-red-600"
        >
          {title}
        </p>
        <p
          data-variant={destructive ? 'destructive' : 'neutral'}
          className="text-sm text-muted-foreground data-[variant=destructive]:text-red-600"
        >
          {description}
        </p>
      </div>
      <div className="flex justify-end items-center gap-4">
        {cancel ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              cancel.onClick();
              sonnerToast.dismiss(id);
            }}
          >
            {cancel.label}
          </Button>
        ) : null}
        {action ? (
          <Button
            variant="black"
            size="sm"
            onClick={() => {
              action.onClick();
              sonnerToast.dismiss(id);
            }}
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { Toaster, toast };
