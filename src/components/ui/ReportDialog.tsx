import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const REASON_OPTIONS = [
  { value: 'Spam', label: 'Spam' },
  { value: 'Conteudo ofensivo', label: 'Conteúdo ofensivo' },
  { value: 'Informacao falsa', label: 'Informação falsa' },
  { value: 'Outro', label: 'Outro' },
];

export interface ReportDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onSubmitted: (reason: string, details: string) => void;
}

export function ReportDialog({ isOpen, onCancel, onSubmitted }: ReportDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setDetails('');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => submitButtonRef.current?.focus(), 0);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const canSubmit = reason && details.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmitted(reason, details.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4 modal-contain">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        aria-describedby="report-dialog-message"
        className="bg-white w-full max-w-md mx-auto shadow-lg overflow-hidden flex flex-col"
      >
        <div className="flex items-start gap-4 p-6">
          <div className="shrink-0 mt-0.5 text-danger">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2
              id="report-dialog-title"
              className="text-lg font-bold text-navy mb-2"
            >
              Denunciar Conteúdo
            </h2>
            <p id="report-dialog-message" className="text-base text-slate leading-loose">
              Sua denúncia será enviada à moderação para análise.
            </p>

            <div className="mt-4">
              <label htmlFor="report-reason" className="block text-sm uppercase tracking-widest font-bold text-navy mb-1">
                Motivo
              </label>
              <select
                id="report-reason"
                className="w-full h-11 border border-border-gray bg-white px-3 text-base text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Selecione um motivo</option>
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label htmlFor="report-details" className="block text-sm uppercase tracking-widest font-bold text-navy mb-1">
                Detalhes
              </label>
              <textarea
                id="report-details"
                className="w-full min-h-[80px] border border-border-gray p-3 text-base text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none leading-loose resize-y transition-colors bg-white/50"
                placeholder="Descreva o problema..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
              />
            </div>
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
            Cancelar
          </Button>
          <Button
            ref={submitButtonRef}
            type="button"
            variant="danger"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            Denunciar
          </Button>
        </div>
      </div>
    </div>
  );
}