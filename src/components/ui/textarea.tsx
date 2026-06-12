import * as React from "react"

import { cn } from "@/src/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[120px] w-full rounded-sm border border-input bg-white/80 px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:shadow-[0_0_0_3px_rgba(5,82,141,0.12)] disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:shadow-none md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
