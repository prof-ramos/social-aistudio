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
        'group relative flex shrink-0 items-center border-l-2 border-institutional-gold pl-3',
        className,
      )}
      aria-label="Social-ASOF - Ir para o feed"
    >
      <span className="hidden sm:block">
        <AsofLogo
          variant="wordmark"
          theme={theme}
          className="h-11 w-[12.5rem] md:h-12 md:w-[13.5rem]"
        />
      </span>
      <span className="sm:hidden">
        <AsofLogo variant="mark" theme={theme} className="h-10 w-10" />
      </span>
    </Link>
  );
}