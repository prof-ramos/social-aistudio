import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import fullLogoSvg from '../../assets/brand/logo.svg?raw';
import markLogoSvg from '../../assets/brand/favicon.svg?raw';

export type AsofLogoVariant = 'full' | 'mark';
export type AsofLogoTheme = 'light' | 'dark' | 'auto';

type AsofLogoProps = {
  variant?: AsofLogoVariant;
  theme?: AsofLogoTheme;
  className?: string;
  title?: string;
};

function resolveTheme(theme: AsofLogoTheme): 'light' | 'dark' {
  if (theme !== 'auto') return theme;
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function withTheme(svg: string, theme: 'light' | 'dark') {
  if (svg.includes('data-theme=')) {
    return svg.replace(/data-theme="(?:light|dark)"/, `data-theme="${theme}"`);
  }
  return svg.replace(/^<svg/, `<svg data-theme="${theme}"`);
}

const VARIANT_SVG: Record<AsofLogoVariant, string> = {
  full: fullLogoSvg,
  mark: markLogoSvg,
};

export function AsofLogo({
  variant = 'full',
  theme = 'auto',
  className,
  title = 'Logo da ASOF',
}: AsofLogoProps) {
  const resolvedTheme = resolveTheme(theme);
  const svgMarkup = useMemo(
    () => withTheme(VARIANT_SVG[variant], resolvedTheme),
    [variant, resolvedTheme],
  );

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center [&>svg]:h-full [&>svg]:w-full',
        variant === 'full' ? 'aspect-[508/304]' : 'aspect-square',
        className,
      )}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}