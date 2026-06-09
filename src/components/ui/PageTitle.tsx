import React from 'react';
import { cn } from '../../lib/utils';

export interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3';
  size?: 'xl' | 'lg' | 'md';
}

export const PageTitle = React.forwardRef<HTMLHeadingElement, PageTitleProps>(
  ({ as: Tag = 'h1', size, className, children, ...props }, ref) => {
    const tagSizeMap: Record<'h1' | 'h2' | 'h3', string> = {
      h1: 'text-4xl',
      h2: 'text-3xl',
      h3: 'text-2xl',
    };

    const propSizeMap: Record<'xl' | 'lg' | 'md', string> = {
      xl: 'text-4xl',
      lg: 'text-3xl',
      md: 'text-2xl',
    };

    const resolvedSize = size ? propSizeMap[size] : tagSizeMap[Tag];

    return (
      <Tag
        ref={ref}
        className={cn('font-serif font-bold text-navy text-balance', resolvedSize, className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

PageTitle.displayName = 'PageTitle';
