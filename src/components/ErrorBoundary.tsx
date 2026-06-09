import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-ice flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-white border-t-4 border-danger/80 shadow-sm max-w-lg w-full text-center p-10">
            <div className="w-16 h-16 bg-danger/5 text-danger flex items-center justify-center mx-auto mb-6 shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-serif text-navy mb-4">Algo deu errado</h1>
            <p className="text-slate mb-8 leading-relaxed">
              Encontramos um erro inesperado ao carregar esta página. Nossa equipe já foi notificada.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-navy text-white font-bold py-3 px-6 hover:bg-slate transition-colors focus:ring-2 focus:ring-navy focus:outline-none"
              >
                VOLTAR PARA O INÍCIO
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white border border-border-gray text-slate font-bold py-3 px-6 hover:bg-ice transition-colors focus:ring-2 focus:ring-slate focus:outline-none"
              >
                TENTAR NOVAMENTE
              </button>
            </div>
            {this.state.error && (
              <div className="mt-8 pt-6 border-t border-border-gray/50 text-left">
                <p className="text-xs uppercase font-bold text-slate/90 mb-2">Detalhes do Erro</p>
                <div className="bg-ice p-4 overflow-auto text-xs text-slate font-mono whitespace-pre-wrap max-h-32">
                  {this.state.error.toString()}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
