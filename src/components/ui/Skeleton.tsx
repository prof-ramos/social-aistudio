import { cn } from '../../lib/utils';
import { Skeleton as ShadcnSkeleton } from './shadcn/skeleton';

export function Skeleton({ className, ...props }: React.ComponentProps<typeof ShadcnSkeleton>) {
  return (
    <ShadcnSkeleton
      data-slot="skeleton"
      className={cn('rounded-none', className)}
      {...props}
    />
  );
}
