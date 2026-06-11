import React, { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from './alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './Button';
import { Label } from './label';
import { Textarea } from './textarea';
import { cn } from '@/src/lib/utils';

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

const iconColor = { danger: 'text-danger', warning: 'text-warning', info: 'text-info' };
const confirmVariant = { danger: 'danger', warning: 'primary', info: 'primary' } as const;

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
  const [inputValue, setInputValue] = useState('');
  // track whether the dialog closed via confirm (vs cancel / escape / outside click)
  const didConfirmRef = useRef(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const confirmed = didConfirmRef.current;
      didConfirmRef.current = false;
      setInputValue('');
      if (!confirmed) onCancel();
    }
  };

  const handleConfirm = () => {
    if (inputRequired && !inputValue.trim()) return;
    didConfirmRef.current = true;
    onConfirm(inputValue || undefined);
  };

  const canConfirm = !inputRequired || !!inputValue.trim();

  // With an input field: Dialog (AlertDialog prevents outside-click dismiss)
  if (inputLabel) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className={cn('shrink-0 mt-0.5', iconColor[variant])}>
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-bold text-navy">{title}</DialogTitle>
                <DialogDescription className="mt-1 text-base text-slate leading-loose">
                  {message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <Label
              htmlFor="confirm-dialog-input"
              className="text-sm uppercase tracking-widest font-bold text-navy"
            >
              {inputLabel}
            </Label>
            <Textarea
              id="confirm-dialog-input"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[80px] resize-y"
              required={inputRequired}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="md" onClick={onCancel} className="w-full sm:w-auto">
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant[variant]}
              size="md"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="w-full sm:w-auto"
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Simple confirmation: AlertDialog (no outside-click dismiss by design)
  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={iconColor[variant]}>
            <AlertTriangle aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" size="md">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant[variant]}
            size="md"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
