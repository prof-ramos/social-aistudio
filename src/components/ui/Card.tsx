import React from 'react';
import { cn } from '../../lib/utils';

// shadcn card primitives (inline to avoid casing conflict with card.tsx)
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 px-6 py-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn('px-6 py-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-footer" className={cn('flex items-center px-6 py-4', className)} {...props} />;
}

// ASOF Card wrapper

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'featured' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variants: Record<NonNullable<CardProps['variant']>, string> = {
  default:  'bg-white border border-border-gray',
  elevated: 'bg-white border border-border-gray shadow-sm',
  featured: 'bg-navy text-white shadow-sm',
  outlined: 'bg-ice border border-border-gray',
};

const paddings: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export const Card = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ref,
  ...props
}: CardProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn('transition-colors', variants[variant], paddings[padding], className)}
    {...props}
  >
    {children}
  </div>
);

Card.displayName = 'Card';
