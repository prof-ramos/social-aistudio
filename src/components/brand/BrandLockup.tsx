import { cn } from '../../lib/utils';
import { AsofLogo, AsofLogoTheme } from './AsofLogo';

type BrandLockupProps = {
  theme?: AsofLogoTheme;
  size?: 'hero' | 'panel' | 'compact';
  showTagline?: boolean;
  showSocialBadge?: boolean;
  className?: string;
};

const logoSizes = {
  hero: 'h-[4.75rem] w-full max-w-[18rem]',
  panel: 'h-[5.5rem] w-full max-w-[20rem]',
  compact: 'h-10 w-[10.5rem]',
};

export function BrandLockup({
  theme = 'light',
  size = 'hero',
  showTagline = true,
  showSocialBadge = true,
  className,
}: BrandLockupProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <AsofLogo variant="full" theme={theme} className={cn('mx-auto', logoSizes[size])} />
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