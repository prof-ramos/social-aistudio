import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/src/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center transition-all duration-200 ease-out font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:not-aria-[haspopup]:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-navy text-white hover:bg-navy-dark hover:shadow-md hover:-translate-y-px disabled:bg-border-gray disabled:text-navy-accent',
        secondary:
          'border border-navy text-navy bg-transparent hover:bg-ice disabled:border-border-gray disabled:text-slate',
        danger:
          'bg-danger text-white-fixed hover:bg-danger/90 disabled:bg-border-gray disabled:text-navy-accent',
        ghost:
          'text-slate hover:bg-ice hover:text-navy disabled:text-border-gray',
        // shadcn standard aliases
        default:
          'bg-navy text-white hover:bg-navy-dark hover:shadow-md hover:-translate-y-px',
        destructive:
          'bg-danger text-white-fixed hover:bg-danger/90',
        outline:
          'border border-navy text-navy bg-transparent hover:bg-ice',
        link: 'text-navy underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-[44px] px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-12 px-6 text-base',
        // shadcn standard aliases
        default: 'h-9 px-5 text-base',
        xs: 'h-8 px-2 text-xs',
        icon: 'size-9',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = ({
  variant,
  size,
  fullWidth,
  isLoading,
  asChild = false,
  className,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
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
    </Comp>
  );
};

Button.displayName = 'Button';

export { buttonVariants };
