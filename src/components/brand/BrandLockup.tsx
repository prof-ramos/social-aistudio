import { cn } from '../../lib/utils';
import { AsofLogo, AsofLogoTheme } from './AsofLogo';

type BrandLockupProps = {
  theme?: AsofLogoTheme;
  size?: 'hero' | 'panel' | 'compact';
  variant?: 'full' | 'wordmark';
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
  showTagline = true,
  showSocialBadge = true,
  className,
}: BrandLockupProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <AsofLogo variant={variant} theme={theme} className={cn('mx-auto', logoSizes[size])} />
      {showSocialBadge && (
        <div className="mt-5 flex items-center gap-3">
          <span className="h-px w-10 bg-institutional-gold/70" aria-hidden="true" />
          <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.28em] text-sky-dark">
            Social
          </span>
          <span className="h-px w-10 bg-institutional-gold/70" aria-hidden="true" />
        </div>
      )}
      {showTagline && (
        <p className="mt-3 max-w-xs font-serif text-sm leading-relaxed text-slate/90">
          Comunidade exclusiva dos associados da ASOF
        </p>
      )}
    </div>
  );
}