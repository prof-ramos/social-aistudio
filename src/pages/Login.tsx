import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export function Login() {
  const navigate = useNavigate();
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
      // App.tsx onAuthStateChanged will handle redirection
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha, ou crie uma conta usando Firebase Console e cadastre o perfil na coleção "users". Se preferir, vá em Solicitar Acesso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ice py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full relative">
        {/* Branding header inside layout */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-5xl font-bold text-navy mb-2">Social-ASOF</h1>
          <p className="text-slate/80 text-sm">Apenas associados da ASOF.</p>
        </div>
        
        <div className="bg-white border border-border-gray p-8 shadow-sm">
          <h2 className="text-xl font-bold text-navy mb-6">Acesse a plataforma</h2>
          
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate">Senha</label>
              </div>
              <input 
                id="password"
                type="password" 
                required
                className="w-full h-11 border border-border-gray rounded-md px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-navy hover:bg-navy-dark text-white h-12 flex items-center justify-center transition-colors shadow-md mt-6 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-gray flex flex-col gap-3">
             <Link to="/solicitar-acesso" className="text-sm font-medium text-navy hover:underline text-center">
               Não tem uma conta? Solicitar acesso
             </Link>
             <Link to="/recuperar-senha" className="text-sm font-medium text-slate hover:underline text-center">
               Esqueci minha senha
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
