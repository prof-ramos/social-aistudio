import { useState, useCallback } from 'react';
import { ConfirmDialog, ConfirmDialogProps } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogProps['variant'];
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
}

interface ConfirmResult {
  confirmed: boolean;
  inputValue?: string;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: ConfirmResult) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<ConfirmResult> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback((inputValue?: string) => {
    setIsOpen(false);
    if (resolver) resolver({ confirmed: true, inputValue });
    setResolver(null);
    setOptions(null);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolver) resolver({ confirmed: false });
    setResolver(null);
    setOptions(null);
  }, [resolver]);

  const dialog = options ? (
    <ConfirmDialog
      isOpen={isOpen}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      inputLabel={options.inputLabel}
      inputPlaceholder={options.inputPlaceholder}
      inputRequired={options.inputRequired}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, dialog };
}
