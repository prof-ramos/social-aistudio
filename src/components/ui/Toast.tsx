import { createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const opts = { duration };
    if (type === 'success') toast.success(message, opts);
    else if (type === 'error') toast.error(message, opts);
    else if (type === 'warning') toast.warning(message, opts);
    else toast.info(message, opts);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
