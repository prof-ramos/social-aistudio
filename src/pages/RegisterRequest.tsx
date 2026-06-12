import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { memberRequestService } from '../services/memberRequestService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';
import { AuthShell } from '../components/brand/AuthShell';

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
      <AuthShell
        title="Solicitação recebida"
        description="A ASOF avaliará os dados e entrará em contato em breve."
      >
        <p className="text-base leading-relaxed text-slate">
          Sua solicitação foi registrada com sucesso. O acesso à plataforma é restrito e passa por validação institucional.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex w-full items-center justify-center bg-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-navy-dark"
        >
          Voltar ao Login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Solicitar acesso"
      description="Preencha os dados para análise pela associação."
      maxWidth="xl"
      backLink={{ to: '/login', label: 'Voltar ao login' }}
    >
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="reg-name" className="block text-base font-medium text-slate mb-1">Nome Completo</Label>
            <Input id="reg-name" required type="text" autoComplete="name" enterKeyHint="next" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="reg-email" className="block text-base font-medium text-slate mb-1">E-mail Pessoal ou Institucional</Label>
            <Input id="reg-email" required type="email" inputMode="email" autoComplete="email" autoCapitalize="none" enterKeyHint="next" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="reg-cpf" className="block text-base font-medium text-slate mb-1">CPF</Label>
            <Input id="reg-cpf" required type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="reg-matricula" className="block text-base font-medium text-slate mb-1">Matrícula SIAPE</Label>
            <Input id="reg-matricula" required type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="reg-category" className="block text-base font-medium text-slate mb-1">Categoria</Label>
            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
              <SelectTrigger id="reg-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBRO_ATIVO">Ativa</SelectItem>
                <SelectItem value="MEMBRO_APOSENTADO">Aposentado(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reg-posto" className="block text-base font-medium text-slate mb-1">Posto Atual (ou Último)</Label>
            <Input id="reg-posto" type="text" autoComplete="organization" enterKeyHint="done" value={formData.currentPost} onChange={e => setFormData({...formData, currentPost: e.target.value})} />
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          className="mt-2"
        >
          {loading ? 'Enviando...' : 'Enviar Solicitação'}
        </Button>
      </form>
    </AuthShell>
  );
}