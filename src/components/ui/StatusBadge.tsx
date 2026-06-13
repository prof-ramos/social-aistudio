import React from 'react';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const statusLabels: Record<StatusBadgeProps['status'], string> = {
  success: 'Sucesso',
  warning: 'Aviso',
  error: 'Erro',
  info: 'Informação',
  neutral: 'Neutro',
};

const variantClasses: Record<StatusBadgeProps['status'], string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error:   'bg-danger/10 text-danger border-danger/20',
  info:    'bg-info/10 text-info border-info/20',
  neutral: 'bg-slate/10 text-slate border-slate/20',
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, children, 'aria-label': ariaLabel, ...props }, ref) => (
    <Badge
      ref={ref}
      variant="outline"
      role="status"
      aria-label={ariaLabel || statusLabels[status]}
      className={cn(
        'h-auto rounded-sm px-2 py-1 text-sm font-semibold',
        variantClasses[status],
        className
      )}
      {...(props as React.ComponentProps<typeof Badge>)}
    >
      {children}
    </Badge>
  )
);

StatusBadge.displayName = 'StatusBadge';
