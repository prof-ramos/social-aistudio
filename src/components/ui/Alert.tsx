import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// shadcn alert primitives (inline to avoid casing conflict with alert.tsx)
const alertVariants = cva(
  'relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function ShadcnAlert({
  className,
  variant,
  role = 'alert',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function ShadcnAlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />;
}

function ShadcnAlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

// ASOF wrapper

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
}

const icons = {
  error:   AlertCircle,
  success: CheckCircle,
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
      {...props}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn('flex items-start gap-3 shadow-sm', variantClasses[variant], className)}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        {title && <ShadcnAlertTitle className="text-base font-bold uppercase tracking-wider">{title}</ShadcnAlertTitle>}
        <ShadcnAlertDescription className={cn('text-base', title && 'mt-1')}>{children}</ShadcnAlertDescription>
      </div>
    </ShadcnAlert>
  );
}
