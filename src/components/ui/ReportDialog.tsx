import React, { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

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
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const didSubmitRef = useRef(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const submitted = didSubmitRef.current;
      didSubmitRef.current = false;
      setReason('');
      setDetails('');
      if (!submitted) onCancel();
    }
  };

  const canSubmit = !!reason && !!details.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    didSubmitRef.current = true;
    onSubmitted(reason, details.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5 text-danger">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-navy">
                Denunciar Conteúdo
              </DialogTitle>
              <DialogDescription className="mt-1 text-base text-slate leading-loose">
                Sua denúncia será enviada à moderação para análise.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="report-reason"
              className="text-sm uppercase tracking-widest font-bold text-navy"
            >
              Motivo
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="report-details"
              className="text-sm uppercase tracking-widest font-bold text-navy"
            >
              Detalhes
            </Label>
            <Textarea
              id="report-details"
              placeholder="Descreva o problema..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[80px] resize-y"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            Denunciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
