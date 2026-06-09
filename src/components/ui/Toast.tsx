import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
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

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-md"
      role="region"
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <React.Fragment key={toast.id}>
          <ToastItem toast={toast} onRemove={removeToast} />
        </React.Fragment>
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const styles = {
    success: 'bg-white border-success/30 text-success',
    error: 'bg-white border-danger/30 text-danger',
    info: 'bg-white border-info/30 text-info',
    warning: 'bg-white border-warning/30 text-warning',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 border shadow-sm min-w-[280px] max-w-md animate-in slide-in-from-right fade-in duration-200 ${styles[toast.type]}`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-base font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-current opacity-80 transition-opacity hover:opacity-100"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
