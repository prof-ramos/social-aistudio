import { useEffect, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import fullLogoSvg from '../../assets/brand/logo.svg?raw';
import markLogoSvg from '../../assets/brand/favicon.svg?raw';

export type AsofLogoVariant = 'full' | 'wordmark' | 'mark';
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
    const cleanedAttrs = attrs
      .replace(/\sdata-theme="(?:light|dark)"/, '')
      .replace(/\srole="img"/, '')
      .replace(/\saria-labelledby="[^"]*"/, '')
      .replace(/\sfocusable="[^"]*"/, '');
    return `<svg data-theme="${theme}" focusable="false"${cleanedAttrs}>`;
  });
}

function withViewBox(svg: string, viewBox: string) {
  return svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
}

const VARIANT_CONFIG: Record<AsofLogoVariant, { source: string; viewBox: string; aspect: string }> = {
  full: { source: fullLogoSvg, viewBox: '0 0 508 304', aspect: 'aspect-[508/304]' },
  wordmark: { source: fullLogoSvg, viewBox: '0 0 508 156', aspect: 'aspect-[508/156]' },
  mark: { source: markLogoSvg, viewBox: '248 -2 156 159', aspect: 'aspect-square' },
};

export function AsofLogo({
  variant = 'full',
  theme = 'auto',
  className,
  title = 'Logo da ASOF',
}: AsofLogoProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const resolvedTheme = resolveTheme(theme);
  const svgMarkup = useMemo(() => {
    const config = VARIANT_CONFIG[variant];
    return withTheme(withViewBox(config.source, config.viewBox), resolvedTheme);
  }, [variant, resolvedTheme]);

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');
    svg?.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, svgMarkup]);

  return (
    <span
      ref={containerRef}
      className={cn(
        'inline-flex shrink-0 items-center [&>svg]:h-full [&>svg]:w-full',
        VARIANT_CONFIG[variant].aspect,
        className,
      )}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}