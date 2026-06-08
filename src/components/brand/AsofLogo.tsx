import { useEffect, useMemo, useRef } from 'react';
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
  return svg.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const cleanedAttrs = attrs.replace(/\sdata-theme="(?:light|dark)"/, '');
    return `<svg data-theme="${theme}"${cleanedAttrs}>`;
  });
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
  const containerRef = useRef<HTMLSpanElement>(null);
  const resolvedTheme = resolveTheme(theme);
  const svgMarkup = useMemo(
    () => withTheme(VARIANT_SVG[variant], resolvedTheme),
    [variant, resolvedTheme],
  );

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');
    svg?.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, svgMarkup]);

  return (
    <span
      ref={containerRef}
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