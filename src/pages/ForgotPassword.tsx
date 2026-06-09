import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { AuthShell } from '../components/brand/AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.sendPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao tentar enviar o e-mail de recuperação. Verifique o endereço e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Recuperação de acesso"
      description="Informe seu e-mail cadastrado para receber as instruções."
    >
      {success ? (
        <div className="text-center space-y-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-lg font-bold text-navy">E-mail enviado</h2>
          <p className="text-sm text-slate">
            Se houver uma conta associada ao e-mail informado, você receberá um link para redefinir sua senha em instantes.
          </p>
          <div className="border-t border-border-gray/80 pt-6">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-medium text-navy transition-colors hover:text-asof-blue">
              <ArrowLeft className="h-4 w-4" /> Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate">E-mail</label>
            <input
              id="email"
              type="email"
              required
              className="w-full h-11 rounded-none border border-border-gray bg-white/80 px-3 text-slate transition-colors focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loading}
            className="mt-2"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>

          <div className="border-t border-border-gray/80 pt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-slate transition-colors hover:text-navy">
              Lembrei minha senha
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}