import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Safe' | 'Warning' | 'Critical' | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    Safe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const defaultStyle = 'bg-muted text-muted-foreground';
  const selectedStyle = styles[status as keyof typeof styles] || defaultStyle;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        selectedStyle,
        className
      )}
    >
      {status}
    </span>
  );
}
