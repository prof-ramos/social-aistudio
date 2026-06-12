import React from 'react';
import { cn } from '../../lib/utils';
import {
  Card as ShadcnCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './shadcn/card';

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

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
