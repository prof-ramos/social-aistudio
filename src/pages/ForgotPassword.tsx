import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, ArrowLeft } from 'lucide-react';

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
      <div className="max-w-md w-full bg-white p-8 border border-border-gray shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-navy">Social-ASOF</h1>
          <p className="text-slate mt-2 text-sm">Recuperação de Acesso</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
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
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate mb-1">E-mail</label>
              <input 
                id="email"
                type="email" 
                required
                className="w-full h-11 border border-border-gray rounded-md px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-navy text-white font-medium hover:bg-navy-dark transition-colors shadow-md disabled:opacity-50 mt-2 focus:ring-2 focus:ring-navy focus:outline-none"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            <div className="pt-4 mt-6 border-t border-border-gray text-center text-sm">
               <Link to="/login" className="text-slate hover:text-navy transition-colors font-medium">Lembrei minha senha</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
