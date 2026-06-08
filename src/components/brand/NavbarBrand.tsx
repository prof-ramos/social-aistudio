import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { AsofLogo } from './AsofLogo';

type NavbarBrandProps = {
  isDarkMode: boolean;
  className?: string;
};

export function NavbarBrand({ isDarkMode, className }: NavbarBrandProps) {
  const theme = isDarkMode ? 'dark' : 'light';

  return (
    <Link
      to="/feed"
      className={cn(
        'group relative flex shrink-0 items-center gap-3 border-l-2 border-institutional-gold pl-3',
        className,
      )}
      aria-label="Social-ASOF - Ir para o feed"
    >
      <AsofLogo
        variant="wordmark"
        theme={theme}
        className="hidden h-11 w-[12.5rem] sm:block md:h-12 md:w-[13.5rem]"
      />
      <AsofLogo variant="mark" theme={theme} className="h-10 w-10 sm:hidden" />
      <span className="hidden min-[1100px]:flex flex-col leading-none">
        <span className="font-sans text-[0.55rem] font-bold uppercase tracking-[0.26em] text-sky-dark">
          Social
        </span>
        <span className="mt-1 font-serif text-sm font-bold text-navy transition-colors group-hover:text-sky-dark">
          ASOF
        </span>
      </span>
    </Link>
  );
}