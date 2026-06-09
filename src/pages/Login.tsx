/// <reference types="vite/client" />
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { AuthShell } from '../components/brand/AuthShell';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          <label htmlFor="email" className="block text-sm font-medium text-slate mb-1">E-mail</label>
          <input
            id="email"
            type="email"
            required
            className="w-full h-11 border border-border-gray rounded-none px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-colors bg-white/80"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate mb-1">Senha</label>
          <input
            id="password"
            type="password"
            required
            className="w-full h-11 border border-border-gray rounded-none px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-colors bg-white/80"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          className="mt-6"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-3 border-t border-border-gray/80 pt-6">
        <Link to="/solicitar-acesso" className="text-center text-sm font-medium text-navy transition-colors hover:text-asof-blue">
          Não tem uma conta? Solicitar acesso
        </Link>
        <Link to="/recuperar-senha" className="text-center text-sm font-medium text-slate transition-colors hover:text-navy">
          Esqueci minha senha
        </Link>
      </div>
    </AuthShell>
  );
}