import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { BrandLockup } from './BrandLockup';

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  maxWidth?: 'md' | 'xl';
  backLink?: { to: string; label: string };
  className?: string;
};

export function AuthShell({
  children,
  title,
  description,
  maxWidth = 'md',
  backLink,
  className,
}: AuthShellProps) {
  return (
    <div className={cn('auth-shell min-h-dvh font-sans', className)}>
      <div className="auth-shell__grid min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <aside className="auth-shell__hero relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-14 xl:px-16">
          <div className="auth-shell__hero-glow" aria-hidden="true" />
          <div className="auth-shell__hero-grid" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-start gap-10 auth-reveal auth-reveal--1">
            <p className="font-sans text-sm font-bold uppercase tracking-[0.32em] text-white/90">
              Associação de Oficiais de Chancelaria
            </p>
            <BrandLockup theme="dark" size="panel" align="start" showSocialBadge showTagline />
            <div className="space-y-5">
              <p className="max-w-md font-serif text-lg leading-loose text-white/95 text-balance">
                Um espaço reservado para diálogo, colaboração e pertencimento entre oficiais de chancelaria.
              </p>
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/90">
                <span className="h-px w-8 bg-institutional-gold" />
                Uso restrito a associados
              </div>
            </div>
          </div>
        </aside>

        <main className="auth-shell__main flex flex-col justify-start px-4 py-10 sm:justify-center sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full lg:hidden mb-8 auth-reveal">
            <BrandLockup theme="light" size="hero" showSocialBadge showTagline={false} />
          </div>

          <div
            className={cn(
              'auth-shell__card mx-auto w-full auth-reveal auth-reveal--2 shadow-2xl shadow-navy-dark/20',
              maxWidth === 'xl' ? 'max-w-xl' : 'max-w-md',
            )}
          >
            <header className="mb-8 border-b border-border-gray/80 pb-6">
              <h1 className="font-serif text-2xl font-bold text-navy text-balance tracking-tight sm:text-[1.75rem]">{title}</h1>
              {description && (
                <p className="mt-2 text-base leading-loose text-slate text-balance">{description}</p>
              )}
            </header>
            {children}
            {backLink && (
              <div className="mt-8 border-t border-border-gray/80 pt-6 text-center">
                <Link
                  to={backLink.to}
                  className="text-base font-medium text-slate transition-colors hover:text-navy"
                >
                  {backLink.label}
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}