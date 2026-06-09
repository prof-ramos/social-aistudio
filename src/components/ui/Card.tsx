import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'featured' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ref,
  ...props
}: CardProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const base = 'transition-colors';

  const variants = {
    default: 'bg-white border border-border-gray',
    elevated: 'bg-white border border-border-gray shadow-sm',
    featured: 'bg-navy text-white shadow-sm',
    outlined: 'bg-ice border border-border-gray',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div ref={ref} className={cn(base, variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';
