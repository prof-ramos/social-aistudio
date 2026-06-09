import { cn } from '../../lib/utils';
import { AsofLogo, AsofLogoTheme } from './AsofLogo';

type BrandLockupProps = {
  theme?: AsofLogoTheme;
  size?: 'hero' | 'panel' | 'compact';
  variant?: 'full' | 'wordmark';
  align?: 'center' | 'start';
  showTagline?: boolean;
  showSocialBadge?: boolean;
  className?: string;
};

const logoSizes = {
  hero: 'h-32 w-full max-w-md sm:h-36',
  panel: 'h-40 w-full max-w-lg xl:h-44',
  compact: 'h-11 w-full max-w-[12.5rem]',
};

export function BrandLockup({
  theme = 'light',
  size = 'hero',
  variant = 'full',
  align = 'center',
  showTagline = true,
  showSocialBadge = true,
  className,
}: BrandLockupProps) {
  const isStart = align === 'start';

  return (
    <div
      className={cn(
        'flex flex-col',
        isStart ? 'items-start text-left' : 'items-center text-center',
        className,
      )}
    >
      <AsofLogo
        variant={variant}
        theme={theme}
        className={cn(!isStart && 'mx-auto', logoSizes[size])}
      />
      {showSocialBadge && (
        <div className={cn('mt-6 flex items-center gap-3', isStart && 'w-full max-w-xs')}>
          <span className="h-px w-10 bg-institutional-gold/70" aria-hidden="true" />
          <span
            className={cn(
              'font-serif text-2xl font-bold uppercase tracking-[0.25em] text-balance',
              theme === 'dark' ? 'text-white' : 'text-navy'
            )}
          >
            Social
          </span>
          <span className="h-px w-10 bg-institutional-gold/70" aria-hidden="true" />
        </div>
      )}
      {showTagline && (
        <p
          className={cn(
            'mt-3 max-w-xs font-serif text-lg leading-loose text-balance',
            theme === 'dark' ? 'text-white/95' : 'text-slate',
            isStart && 'max-w-sm',
          )}
        >
          Comunidade exclusiva dos associados da ASOF
        </p>
      )}
    </div>
  );
}