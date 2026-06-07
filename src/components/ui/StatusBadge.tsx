import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, children, ...props }, ref) => {
    const variants = {
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-danger/10 text-danger border-danger/20',
      info: 'bg-info/10 text-info border-info/20',
      neutral: 'bg-slate/10 text-slate border-slate/20',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border rounded-sm',
          variants[status],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
