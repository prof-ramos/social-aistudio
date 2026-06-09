import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchResult } from '../../services/searchService';

interface GlobalSearchDropdownProps {
  query: string;
  results: SearchResult;
  isSearching: boolean;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function GlobalSearchDropdown({ query, results, isSearching, onClose, inputRef }: GlobalSearchDropdownProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => [
    ...results.users.map(u => ({ type: 'user' as const, id: u.id, label: u.name, sub: u.currentPost, avatarUrl: u.avatarUrl, navigateTo: `/perfil/${u.id}` })),
    ...results.posts.map(p => ({ type: 'post' as const, id: p.id, label: p.title, sub: p.authorName, navigateTo: `/feed/${p.id}` })),
    ...results.postos.map(p => ({ type: 'posto' as const, id: p.id, label: p.name, sub: p.country, navigateTo: `/postos/${p.slug}` })),
  ], [results]);

  const hasResults = allItems.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % Math.max(allItems.length, 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
      return;
    }
    if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < allItems.length) {
      e.preventDefault();
      navigate(allItems[activeIndex].navigateTo);
      onClose();
      return;
    }
  }, [allItems, activeIndex, navigate, onClose]);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown as any);
      return () => input.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [handleKeyDown, inputRef]);

  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (query.length < 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-gray shadow-lg z-50 rounded-sm py-3 px-4 text-sm text-slate">
        Digite pelo menos 2 caracteres...
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-gray shadow-lg z-50 rounded-sm py-3 px-4 text-sm text-slate">
        Buscando...
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-gray shadow-lg z-50 rounded-sm py-3 px-4 text-sm text-slate">
        Nenhum resultado encontrado.
      </div>
    );
  }

  let globalIdx = -1;

  const renderGroup = (type: 'user' | 'post' | 'posto', icon: React.ReactNode, label: string, items: typeof allItems) => {
    if (items.length === 0) return null;
    return (
      <div key={type}>
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate/60 border-b border-border-gray/50">
          {icon}<span className="ml-1.5">{label}</span>
        </div>
        {items.map(item => {
          globalIdx++;
          const idx = globalIdx;
          const isActive = idx === activeIndex;
          return (
            <button
              key={`${item.type}-${item.id}`}
              data-index={idx}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors min-h-[44px]',
                isActive ? 'bg-ice text-navy' : 'text-navy hover:bg-ice/50'
              )}
              onClick={() => { navigate(item.navigateTo); onClose(); }}
            >
              {item.type === 'user' && (item.avatarUrl ? (
                <img src={item.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 bg-ice rounded-full flex items-center justify-center text-navy font-bold text-xs flex-shrink-0">
                  {item.label.charAt(0)}
                </div>
              ))}
              {item.type === 'post' && <FileText className="w-4 h-4 text-slate flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />}
              {item.type === 'posto' && <Compass className="w-4 h-4 text-slate flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.label}</p>
                {item.sub && <p className="text-xs text-slate truncate">{item.sub}</p>}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const userItems = allItems.filter(i => i.type === 'user');
  const postItems = allItems.filter(i => i.type === 'post');
  const postoItems = allItems.filter(i => i.type === 'posto');

  globalIdx = -1;

  return (
    <div ref={containerRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-gray shadow-lg z-50 rounded-sm max-h-80 overflow-y-auto" role="listbox" aria-label="Resultados da busca">
      {renderGroup('user', <User className="w-3.5 h-3.5 inline" strokeWidth={1.5} aria-hidden="true" />, 'Membros', userItems)}
      {renderGroup('post', <FileText className="w-3.5 h-3.5 inline" strokeWidth={1.5} aria-hidden="true" />, 'Posts', postItems)}
      {renderGroup('posto', <Compass className="w-3.5 h-3.5 inline" strokeWidth={1.5} aria-hidden="true" />, 'Postos', postoItems)}
    </div>
  );
}