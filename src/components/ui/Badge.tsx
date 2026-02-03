'use client';

import { clsx } from 'clsx';

interface BadgeProps {
  variant: 'pending' | 'true' | 'false';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-gray-100 text-gray-800': variant === 'pending',
          'bg-green-100 text-green-800': variant === 'true',
          'bg-red-100 text-red-800': variant === 'false',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
