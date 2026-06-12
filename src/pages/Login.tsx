/// <reference types="vite/client" />
import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Input, Label } from '../components/ui';
import { AuthShell } from '../components/brand/AuthShell';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha. Se ainda não tem acesso, solicite em "Solicitar Acesso".');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Acesse a plataforma"
      description="Apenas associados da ASOF."
    >
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="block text-base font-medium text-slate mb-1">E-mail</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            enterKeyHint="next"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password" className="block text-base font-medium text-slate mb-1">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              enterKeyHint="go"
              required
              className="pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-1 rounded-sm transition-all duration-200 ease-out active:scale-95"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          className="mt-6"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Entrar'}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-2 border-t border-border-gray/80 pt-4">
        <Link to="/solicitar-acesso" className="flex items-center justify-center min-h-[44px] text-center text-base font-semibold text-navy transition-colors hover:text-asof-blue hover:underline underline-offset-2">
          Não tem uma conta? Solicitar acesso
        </Link>
        <Link to="/recuperar-senha" className="flex items-center justify-center min-h-[44px] text-center text-base font-semibold text-navy transition-colors hover:text-asof-blue hover:underline underline-offset-2">
          Esqueci minha senha
        </Link>
      </div>
    </AuthShell>
  );
}