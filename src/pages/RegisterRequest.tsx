import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { memberRequestService } from '../services/memberRequestService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { AsofLogo } from '../components/brand/AsofLogo';

export function RegisterRequest() {
  const [formData, setFormData] = useState({
    name: '', email: '', cpf: '', matricula: '', category: 'MEMBRO_ATIVO', currentPost: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await memberRequestService.createRequest(formData);
      
      // Notify Admin via Email
      await fetch('/api/admin/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, matricula: formData.matricula })
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice py-12 px-4 font-sans">
        <Card variant="elevated" padding="lg" className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-navy mb-4 font-serif">Solicitação Recebida</h2>
          <p className="text-slate mb-8">Sua solicitação foi recebida com sucesso. A ASOF avaliará os dados e entrará em contato em breve.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-navy text-white hover:bg-navy-dark transition-colors font-medium">Voltar ao Login</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-ice py-12 px-4 font-sans">
      <div className="text-center mb-8">
        <AsofLogo variant="full" theme="light" className="h-16 w-full max-w-xs mx-auto mb-3" />
        <p className="font-serif text-xl font-bold text-navy">Social-ASOF</p>
      </div>
      <Card variant="elevated" padding="lg" className="max-w-xl w-full">
        <h2 className="text-xl font-bold text-navy mb-6">Solicitar Acesso</h2>
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div>
               <label htmlFor="reg-name" className="block text-sm font-medium text-slate mb-1">Nome Completo</label>
               <input id="reg-name" required type="text" className="w-full h-11 border border-border-gray rounded-none px-3 focus:ring-1 focus:ring-navy focus:outline-none transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>
             <div>
               <label htmlFor="reg-email" className="block text-sm font-medium text-slate mb-1">E-mail Pessoal ou Institucional</label>
               <input id="reg-email" required type="email" className="w-full h-11 border border-border-gray rounded-none px-3 focus:ring-1 focus:ring-navy focus:outline-none transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div>
               <label htmlFor="reg-cpf" className="block text-sm font-medium text-slate mb-1">CPF</label>
               <input id="reg-cpf" required type="text" className="w-full h-11 border border-border-gray rounded-none px-3 focus:ring-1 focus:ring-navy focus:outline-none transition-colors" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
             </div>
             <div>
               <label htmlFor="reg-matricula" className="block text-sm font-medium text-slate mb-1">Matrícula SIAPE</label>
               <input id="reg-matricula" required type="text" className="w-full h-11 border border-border-gray rounded-none px-3 focus:ring-1 focus:ring-navy focus:outline-none transition-colors" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} />
             </div>
             <div>
               <label htmlFor="reg-category" className="block text-sm font-medium text-slate mb-1">Categoria</label>
               <select id="reg-category" className="w-full h-11 border border-border-gray rounded-none px-3 bg-white focus:ring-1 focus:ring-navy focus:outline-none transition-colors" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                 <option value="MEMBRO_ATIVO">Ativa</option>
                 <option value="MEMBRO_APOSENTADO">Aposentado(a)</option>
               </select>
             </div>
             <div>
               <label htmlFor="reg-posto" className="block text-sm font-medium text-slate mb-1">Posto Atual (ou Último)</label>
               <input id="reg-posto" type="text" className="w-full h-11 border border-border-gray rounded-none px-3 focus:ring-1 focus:ring-navy focus:outline-none transition-colors" value={formData.currentPost} onChange={e => setFormData({...formData, currentPost: e.target.value})} />
             </div>
           </div>
           <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="mt-4"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-slate hover:underline">Voltar ao Login</Link>
        </div>
      </Card>
    </div>
  );
}
