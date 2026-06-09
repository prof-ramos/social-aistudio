import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  fullWidth,
  className,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const base =
    'inline-flex items-center justify-center transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 font-medium active:scale-[0.97]';

  const variants = {
    primary:
      'bg-navy text-white hover:bg-asof-blue hover:shadow-md hover:-translate-y-px disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-navy',
    secondary:
      'border border-navy text-navy bg-transparent hover:bg-ice disabled:opacity-80 disabled:cursor-not-allowed',
    danger:
      'bg-danger text-white-fixed hover:bg-danger/90 disabled:opacity-80 disabled:cursor-not-allowed',
    ghost:
      'text-slate hover:bg-ice hover:text-navy disabled:opacity-80 disabled:cursor-not-allowed',
  };

  const sizes = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-11 px-5 text-base',
    lg: 'h-12 px-6 text-base',
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
};

Button.displayName = 'Button';
