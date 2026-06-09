import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="bg-white w-full max-w-md mx-auto shadow-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border-gray flex items-center justify-between">
          <h2
            id="keyboard-shortcuts-title"
            className="text-2xl font-bold text-navy font-serif"
          >
            Atalhos de Teclado
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate hover:text-navy transition-colors focus:outline-none focus:ring-2 focus:ring-navy rounded"
            aria-label="Fechar atalhos"
          >
            <span aria-hidden="true" className="text-2xl leading-none">×</span>
          </button>
        </div>

        <ul className="flex-1 py-2" role="list">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.keys.join('+')}
              className="flex items-center justify-between px-6 py-3 hover:bg-ice/50 transition-colors"
            >
              <span className="text-sm text-slate">{shortcut.description}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={key}>
                    {i > 0 && (
                      <span className="text-sm text-muted mx-0.5">+</span>
                    )}
                    <kbd className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 bg-ice border border-border-gray font-mono text-sm text-navy leading-none select-none">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <div className="px-6 py-4 border-t border-border-gray bg-ice/30">
          <p className="text-sm text-muted text-center">
            Pressione <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 bg-white border border-border-gray font-mono text-sm text-navy leading-none select-none">?</kbd> para abrir ou fechar
          </p>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '?') return;

      // Don't toggle if modal is already open
      if (isOpen) return;

      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      const isEditable =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable;

      if (isEditable) return;

      e.preventDefault();
      toggle();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, isOpen]);

  return { isOpen, close };
}

