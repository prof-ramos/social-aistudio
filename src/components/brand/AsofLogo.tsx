import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export type AsofLogoVariant = 'full' | 'wordmark' | 'mark';
export type AsofLogoTheme = 'light' | 'dark' | 'auto';

type AsofLogoProps = {
  variant?: AsofLogoVariant;
  theme?: AsofLogoTheme;
  className?: string;
  title?: string;
};

const SVG_PATHS: Record<AsofLogoVariant, string> = {
  full: '/logo.svg',
  wordmark: '/logo.svg',
  mark: '/favicon.svg',
};

const VIEWBOX: Record<AsofLogoVariant, string> = {
  full: '0 0 508 304',
  wordmark: '0 0 508 156',
  mark: '248 -2 156 159',
};

const ASPECT: Record<AsofLogoVariant, string> = {
  full: 'aspect-[508/304]',
  wordmark: 'aspect-[508/156]',
  mark: 'aspect-square',
};

const svgCache = new Map<string, Promise<string>>();

function fetchSvg(path: string): Promise<string> {
  if (!svgCache.has(path)) {
    svgCache.set(
      path,
      fetch(path).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.text();
      }),
    );
  }
  return svgCache.get(path)!;
}

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

export function AsofLogo({
  variant = 'full',
  theme = 'auto',
  className,
  title = 'Logo da ASOF',
}: AsofLogoProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const resolvedTheme = resolveTheme(theme);
  const [svgSource, setSvgSource] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    fetchSvg(SVG_PATHS[variant])
      .then((markup) => {
        if (!cancelled) setSvgSource(markup);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [variant]);

  const svgMarkup = useMemo(() => {
    if (!svgSource) return '';
    return withTheme(withViewBox(svgSource, VIEWBOX[variant]), resolvedTheme);
  }, [svgSource, variant, resolvedTheme]);

  useEffect(() => {
    const svg = containerRef.current?.querySelector('svg');
    svg?.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, svgMarkup]);

  if (!svgMarkup) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center bg-ice/60',
          ASPECT[variant],
          className,
        )}
        role="img"
        aria-label={title}
        aria-busy={!loadError}
      />
    );
  }

  return (
    <span
      ref={containerRef}
      className={cn(
        'inline-flex shrink-0 items-center [&>svg]:h-full [&>svg]:w-full',
        ASPECT[variant],
        className,
      )}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}