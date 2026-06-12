import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchResult } from '../../services/searchService';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '../ui/command';

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (allItems.length === 0) return;
      setActiveIndex(prev => (prev + 1) % allItems.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (allItems.length === 0) return;
      setActiveIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
      return;
    }
    if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < allItems.length) {
      e.preventDefault();
      navigate(allItems[activeIndex].navigateTo);
      onClose();
    }
  }, [allItems, activeIndex, navigate, onClose]);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, inputRef]);

  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const userItems = allItems.filter(i => i.type === 'user');
  const postItems = allItems.filter(i => i.type === 'post');
  const postoItems = allItems.filter(i => i.type === 'posto');

  const userOffset = 0;
  const postOffset = userItems.length;
  const postoOffset = userItems.length + postItems.length;

  const groupHeadingClass = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-border-gray/50";
  const itemBaseClass = "rounded-none! px-3 py-2.5 min-h-[44px] text-base text-navy gap-3 cursor-pointer";

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border shadow-lg z-50 max-h-80 overflow-hidden"
    >
      <Command shouldFilter={false} className="rounded-none!">
        <CommandList className="max-h-80">
          {(query.length < 2 || isSearching || !hasResults) ? (
            <CommandEmpty className="py-3 px-4 text-base text-slate text-left">
              {query.length < 2
                ? 'Digite pelo menos 2 caracteres...'
                : isSearching
                  ? 'Buscando...'
                  : 'Nenhum resultado encontrado.'}
            </CommandEmpty>
          ) : (
            <>
              {userItems.length > 0 && (
                <CommandGroup
                  heading={<span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-navy"><User className="w-4 h-4" aria-hidden="true" />Membros</span>}
                  className={groupHeadingClass}
                >
                  {userItems.map((item, i) => {
                    const idx = userOffset + i;
                    const isActive = idx === activeIndex;
                    return (
                      <CommandItem
                        key={`user-${item.id}`}
                        data-index={idx}
                        value={`user-${item.id}`}
                        onSelect={() => { navigate(item.navigateTo); onClose(); }}
                        className={cn(itemBaseClass, isActive && "bg-ice")}
                      >
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 bg-ice rounded-full flex items-center justify-center text-navy font-bold text-sm flex-shrink-0">
                            {item.label.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.label}</p>
                          {item.sub && <p className="text-sm text-slate truncate">{item.sub}</p>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {postItems.length > 0 && (
                <CommandGroup
                  heading={<span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-navy"><FileText className="w-4 h-4" aria-hidden="true" />Posts</span>}
                  className={groupHeadingClass}
                >
                  {postItems.map((item, i) => {
                    const idx = postOffset + i;
                    const isActive = idx === activeIndex;
                    return (
                      <CommandItem
                        key={`post-${item.id}`}
                        data-index={idx}
                        value={`post-${item.id}`}
                        onSelect={() => { navigate(item.navigateTo); onClose(); }}
                        className={cn(itemBaseClass, isActive && "bg-ice")}
                      >
                        <FileText className="w-4 h-4 text-slate flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.label}</p>
                          {item.sub && <p className="text-sm text-slate truncate">{item.sub}</p>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {postoItems.length > 0 && (
                <CommandGroup
                  heading={<span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-navy"><Compass className="w-4 h-4" aria-hidden="true" />Postos</span>}
                  className={groupHeadingClass}
                >
                  {postoItems.map((item, i) => {
                    const idx = postoOffset + i;
                    const isActive = idx === activeIndex;
                    return (
                      <CommandItem
                        key={`posto-${item.id}`}
                        data-index={idx}
                        value={`posto-${item.id}`}
                        onSelect={() => { navigate(item.navigateTo); onClose(); }}
                        className={cn(itemBaseClass, isActive && "bg-ice")}
                      >
                        <Compass className="w-4 h-4 text-slate flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.label}</p>
                          {item.sub && <p className="text-sm text-slate truncate">{item.sub}</p>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
