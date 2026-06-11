import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

export interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['/'], description: 'Buscar' },
  { keys: ['n'], description: 'Novo post' },
  { keys: ['Esc'], description: 'Fechar modal' },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-navy font-serif">
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <ul className="py-1" role="list">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.keys.join('+')}
              className="flex items-center justify-between px-2 py-3 hover:bg-ice/50 transition-colors"
            >
              <span className="text-sm text-slate">{shortcut.description}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={key}>
                    {i > 0 && <span className="text-sm text-slate/50 mx-0.5">+</span>}
                    <kbd className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 bg-ice border border-border-gray font-mono text-sm text-navy leading-none select-none">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="-mx-4 -mb-4 px-4 py-3 border-t border-border-gray bg-ice/30">
          <p className="text-sm text-slate text-center">
            Pressione{' '}
            <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 bg-white border border-border-gray font-mono text-xs text-navy leading-none select-none">
              ?
            </kbd>{' '}
            para abrir ou fechar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useKeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '?') return;
      if (isOpen) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      e.preventDefault();
      toggle();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, isOpen]);

  return { isOpen, close };
}
