import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';

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
    <div className="min-h-screen flex items-center justify-center bg-ice py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Card variant="elevated" padding="lg" className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy">Social-ASOF</h1>
          <p className="text-slate mt-2 text-sm">Recuperação de Acesso</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success/20">
               <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-navy">E-mail enviado!</h2>
            <p className="text-slate text-sm">
              Se houver uma conta associada ao e-mail informado, você receberá um link para redefinir sua senha em instantes.
            </p>
            <div className="pt-4 mt-6 border-t border-border-gray">
              <Link to="/login" className="text-navy font-medium text-sm flex items-center justify-center gap-2 hover:text-sky transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-slate text-sm mb-4">
              Informe seu e-mail cadastrado. Enviaremos as instruções para você redefinir sua senha.
            </p>

            {error && (
              <Alert variant="error">{error}</Alert>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate mb-1">E-mail</label>
              <input 
                id="email"
                type="email" 
                required
                className="w-full h-11 border border-border-gray rounded-none px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-colors"
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
            <div className="pt-4 mt-6 border-t border-border-gray text-center text-sm">
               <Link to="/login" className="text-slate hover:text-navy transition-colors font-medium">Lembrei minha senha</Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
