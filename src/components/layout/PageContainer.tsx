import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type PageWidth = 'feed' | 'narrow' | 'detail' | 'full';

const widthClasses: Record<PageWidth, string> = {
  feed: 'max-w-[var(--page-max-width-feed)]',
  narrow: 'max-w-[var(--page-max-width-narrow)]',
  detail: 'max-w-[var(--page-max-width-detail)]',
  full: 'max-w-none',
};

type PageContainerProps = {
  variant?: PageWidth;
  className?: string;
  children: ReactNode;
};

export function PageContainer({
  variant = 'feed',
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0',
        widthClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}