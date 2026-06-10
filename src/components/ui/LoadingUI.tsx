export function LoadingUI() {
  return (
    <div className="h-dvh min-h-screen w-full bg-ice font-sans flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        <p className="text-sm text-slate font-medium">Carregando...</p>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="h-dvh min-h-screen w-full bg-ice font-sans flex flex-col overflow-hidden">
      <header className="h-16 bg-navy flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white/10 animate-pulse rounded-none" />
          <div className="w-32 h-6 bg-white/10 animate-pulse" />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-6 h-6 bg-white/10 animate-pulse rounded-none" />
          <div className="w-6 h-6 bg-white/10 animate-pulse rounded-none" />
          <div className="w-8 h-8 bg-white/10 animate-pulse rounded-full" />
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-border-gray hidden md:flex flex-col py-8 px-6 flex-none shrink-0">
          <div className="mb-8">
            <div className="w-20 h-3 bg-slate/10 animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-slate/10 animate-pulse" />
                  <div className="flex-1 h-4 bg-slate/10 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </aside>
        <section id="main-content" className="flex-1 p-4 sm:p-8 lg:p-16 overflow-y-auto bg-ice">
          <div className="mx-auto w-full max-w-[var(--page-max-width-feed)] space-y-8">
            <div className="w-48 h-8 bg-slate/10 animate-pulse" />
            <div className="w-full h-40 bg-white border border-border-gray shadow-sm animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-48 bg-white border border-border-gray shadow-sm animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
