import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-0 font-medium';

    const variants = {
      primary:
        'bg-navy text-white hover:bg-navy-dark disabled:opacity-50 disabled:cursor-not-allowed',
      secondary:
        'border border-navy text-navy bg-transparent hover:bg-ice disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-danger text-white hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed',
      ghost:
        'text-slate hover:bg-ice hover:text-navy disabled:opacity-50 disabled:cursor-not-allowed',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
