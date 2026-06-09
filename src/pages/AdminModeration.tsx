import React from 'react';
import { ShieldAlert, Check, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useAdminModeration } from '../hooks/useAdminModeration';
import { Card } from '../components/ui/Card';
import { PageTitle } from '../components/ui/PageTitle';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageContainer } from '../components/layout/PageContainer';

export default function AdminModeration() {
  const {
    pendingReports,
    resolvedReports,
    loading,
    resolvingId,
    setResolvingId,
    notes,
    setNotes,
    action,
    setAction,
    handleResolve
  } = useAdminModeration();

  if (loading) {
    return (
      <PageContainer variant="feed" className="animate-pulse space-y-8 pb-12">
        <div>
          <div className="w-48 h-8 bg-slate/10 mb-3" />
          <div className="w-96 h-5 bg-slate/10" />
        </div>
        <Card variant="elevated" padding="lg" className="h-[calc(100dvh-12rem)] min-h-[24rem]">
          <div className="w-full h-10 bg-slate/10 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-16 bg-slate/10" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="feed" className="space-y-8 pb-12">
      <Breadcrumb items={[{ label: 'Início', href: '/feed' }, { label: 'Admin', href: '/admin' }, { label: 'Moderação' }]} />
      <div>
        <PageTitle as="h1" size="xl">Moderação</PageTitle>
        <p className="text-slate leading-relaxed">Gerencie denúncias de conteúdo publicadas na plataforma.</p>
      </div>

      <Card variant="elevated" className="flex h-[calc(100dvh-12rem)] min-h-[24rem] flex-col">
        {pendingReports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate">
            <ShieldAlert className="w-12 h-12 mb-4 opacity-80" />
            <p>Nenhuma denúncia pendente.</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ice border-b border-border-gray text-sm font-bold uppercase tracking-wider text-slate">
                  <th scope="col" className="p-4">Conteúdo</th>
                  <th scope="col" className="p-4">Motivo / Denunciante</th>
                  <th scope="col" className="p-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {pendingReports.map(rep => (
                  <tr key={rep.id} className="hover:bg-ice/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-sky uppercase tracking-wider mb-1">{rep.type}</span>
                        <p className="text-base text-slate overflow-hidden text-ellipsis line-clamp-3 leading-relaxed">{rep.preview}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-base font-bold text-navy leading-relaxed">{rep.reason}</p>
                      <p className="text-sm text-slate opacity-80 leading-relaxed">Por: {rep.reportedBy}</p>
                    </td>
                    <td className="p-4">
                      {resolvingId === rep.id ? (
                        <form onSubmit={(e) => handleResolve(rep.id, e)} className="bg-ice p-3 rounded-none border border-border-gray space-y-3 min-w-[250px]">
                          <div>
                            <label htmlFor="acao" className="block text-sm font-bold text-slate mb-1">Ação</label>
                            <select
                              id="acao"
                              className="w-full min-h-[44px] border border-border-gray rounded text-base px-2 focus:ring-2 focus:ring-navy focus:outline-none"
                              value={action}
                              onChange={e => setAction(e.target.value as any)}
                            >
                              <option value="RESOLVED_KEPT">Manter Conteúdo (Rejeitar Denúncia)</option>
                              <option value="RESOLVED_WARNED">Advertir Autor (Manter Conteúdo)</option>
                              <option value="RESOLVED_REMOVED">Remover Conteúdo (Ocultar)</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="nota-interna" className="block text-sm font-bold text-slate mb-1">Nota Interna (Obrigatório)</label>
                            <textarea
                              id="nota-interna"
                              required
                              className="w-full min-h-[60px] border border-border-gray rounded text-base p-2 focus:ring-2 focus:ring-navy focus:outline-none resize-none"
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              placeholder="Descreva a razão da decisão..."
                            ></textarea>
                          </div>
                          <div className="flex gap-2">
                             <Button type="button" variant="ghost" size="sm" fullWidth onClick={() => setResolvingId(null)} className="min-h-[44px]">Cancelar</Button>
                             <Button type="submit" variant="primary" size="sm" fullWidth className="min-h-[44px]">Confirmar <ArrowRight className="w-3 h-3" /></Button>
                          </div>
                        </form>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setResolvingId(rep.id); setNotes(''); setAction('RESOLVED_KEPT'); }}
                          className="min-h-[44px]"
                        >
                          Resolver
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {resolvedReports.length > 0 && (
        <div>
          <PageTitle as="h2" size="lg">Histórico de Moderação</PageTitle>
          <Card variant="elevated" className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ice border-b border-border-gray text-sm font-bold uppercase tracking-wider text-slate">
                  <th scope="col" className="p-4">Conteúdo</th>
                  <th scope="col" className="p-4">Resolução</th>
                  <th scope="col" className="p-4">Nota Interna</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray text-base text-slate">
                {resolvedReports.map(rep => (
                  <tr key={rep.id}>
                    <td className="p-4">
                      <span className="text-sm font-bold text-sky uppercase">{rep.type}</span>
                      <p className="line-clamp-2 max-w-xs leading-relaxed">{rep.preview}</p>
                    </td>
                    <td className="p-4">
                      {rep.status === 'RESOLVED_KEPT' && <StatusBadge status="neutral"><Check className="w-3 h-3" /> Mantido</StatusBadge>}
                      {rep.status === 'RESOLVED_WARNED' && <StatusBadge status="warning"><AlertTriangle className="w-3 h-3" /> Advertido</StatusBadge>}
                      {rep.status === 'RESOLVED_REMOVED' && <StatusBadge status="error"><Trash2 className="w-3 h-3" /> Removido</StatusBadge>}
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{rep.notes}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
