import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'error', title, className, children, ...props }, ref) => {
    const icons = {
      error: AlertCircle,
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
    };

    const variants = {
      error: 'bg-danger/5 border-danger/20 text-danger',
      success: 'bg-success/5 border-success/20 text-success',
      warning: 'bg-warning/5 border-warning/20 text-warning',
      info: 'bg-info/5 border-info/20 text-info',
    };

    const Icon = icons[variant];

    const liveRole = variant === 'error' ? 'alert' : 'status';

    return (
      <div
        ref={ref}
        role={liveRole}
        aria-live={variant === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'flex items-start gap-3 p-4 border shadow-sm',
          variants[variant],
          className
        )}
        {...props}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && (
            <h3 className="text-base font-bold uppercase tracking-wider">{title}</h3>
          )}
          <p className={cn('text-base', title && 'mt-1')}>{children}</p>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
