import React from 'react';
import { cn } from '../../lib/utils';
import {
  Alert as ShadcnAlert,
  AlertTitle as ShadcnAlertTitle,
  AlertDescription as ShadcnAlertDescription,
} from './shadcn/alert';
import { XCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
}

const icons = {
  error:   XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info:    Info,
};

const variantClasses: Record<NonNullable<AlertProps['variant']>, string> = {
  error:   'bg-danger/5 border-danger/20 text-danger font-medium',
  success: 'bg-success/5 border-success/20 text-success',
  warning: 'bg-warning/5 border-warning/20 text-warning',
  info:    'bg-info/5 border-info/20 text-info',
};

export function Alert({ variant = 'error', title, className, children, ...props }: AlertProps) {
  const Icon = icons[variant];
  return (
    <ShadcnAlert
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn('flex items-start gap-3 shadow-sm', variantClasses[variant], className)}
      {...props}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        {title && <ShadcnAlertTitle className="text-base font-bold uppercase tracking-wider">{title}</ShadcnAlertTitle>}
        <ShadcnAlertDescription className={cn('text-base', title && 'mt-1')}>{children}</ShadcnAlertDescription>
      </div>
    </ShadcnAlert>
  );
}
