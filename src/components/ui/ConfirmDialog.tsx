import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  inputLabel,
  inputPlaceholder,
  inputRequired = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus input if present, otherwise confirm button
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }, 0);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  };

  const confirmVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
  };

  const handleConfirmClick = () => {
    if (inputRequired && !inputValue.trim()) return;
    onConfirm(inputValue || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4 modal-contain">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="bg-white w-full max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-start gap-4 p-6">
          <div className={`shrink-0 mt-0.5 ${variantStyles[variant]}`}>
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold text-navy mb-2"
            >
              {title}
            </h2>
            <p id="confirm-dialog-message" className="text-base text-slate leading-loose">
              {message}
            </p>

            {inputLabel && (
              <div className="mt-4">
                <label htmlFor="confirm-dialog-input" className="block text-sm uppercase tracking-widest font-bold text-navy mb-1">
                  {inputLabel}
                </label>
                <textarea
                  ref={inputRef}
                  id="confirm-dialog-input"
                  className="w-full min-h-[80px] border border-border-gray p-3 text-base text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none leading-loose resize-y transition-colors bg-white/50"
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  required={inputRequired}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 pt-0">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            variant={confirmVariants[variant]}
            size="md"
            onClick={handleConfirmClick}
            disabled={inputRequired && !inputValue.trim()}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
