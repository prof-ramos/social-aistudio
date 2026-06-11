import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
}

export const Checkbox = ({
  className,
  label,
  id,
  ref,
  ...props
}: CheckboxProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="flex min-h-[44px] items-center gap-3">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        data-slot="checkbox"
        className={cn(
          'peer size-5 shrink-0 border border-border-gray bg-white transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-navy data-[state=checked]:border-navy data-[state=checked]:text-white',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="size-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label
          htmlFor={checkboxId}
          className="min-h-[44px] flex items-center text-base text-slate leading-relaxed cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      )}
    </div>
  );
};

Checkbox.displayName = 'Checkbox';
