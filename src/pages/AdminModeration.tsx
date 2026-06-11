import React from 'react';
import { ShieldAlert, Check, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useAdminModeration, type Report } from '../hooks/useAdminModeration';
import { Card } from '../components/ui/Card';
import { PageTitle } from '../components/ui/PageTitle';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageContainer } from '../components/layout/PageContainer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

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
            <ShieldAlert className="w-12 h-12 mb-4 text-slate" />
            <p>Nenhuma denúncia pendente.</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-ice border-b border-border-gray hover:bg-ice">
                  <TableHead scope="col" className="p-4 text-sm font-bold uppercase tracking-wider text-slate">Conteúdo</TableHead>
                  <TableHead scope="col" className="p-4 text-sm font-bold uppercase tracking-wider text-slate">Motivo / Denunciante</TableHead>
                  <TableHead scope="col" className="p-4 text-sm font-bold uppercase tracking-wider text-slate">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReports.map(rep => (
                  <TableRow key={rep.id} className="hover:bg-ice/30 transition-colors">
                    <TableCell className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-sky uppercase tracking-wider mb-1">{rep.type}</span>
                        <p className="text-base text-slate overflow-hidden text-ellipsis line-clamp-3 leading-relaxed">{rep.preview}</p>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <p className="text-base font-bold text-navy leading-relaxed">{rep.reason}</p>
                      <p className="text-sm text-slate font-medium leading-relaxed">Por: {rep.reportedBy}</p>
                    </TableCell>
                    <TableCell className="p-4">
                      {resolvingId === rep.id ? (
                        <form onSubmit={(e) => handleResolve(rep.id, e)} className="bg-ice p-3 rounded-none border border-border-gray space-y-3 min-w-[250px]">
                          <div>
                            <label htmlFor="acao" className="block text-sm font-bold text-slate mb-1">Ação</label>
                            <select
                              id="acao"
                              className="w-full min-h-[44px] border border-border-gray rounded text-base px-2 focus:ring-2 focus:ring-navy focus:outline-none"
                              value={action}
                              onChange={e => setAction(e.target.value as Report['status'])}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {resolvedReports.length > 0 && (
        <div>
          <PageTitle as="h2" size="lg">Histórico de Moderação</PageTitle>
          <Card variant="elevated" className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-ice border-b border-border-gray hover:bg-ice">
                  <TableHead scope="col" className="p-4 text-sm font-bold uppercase tracking-wider text-slate">Conteúdo</TableHead>
                  <TableHead scope="col" className="p-4 text-sm font-bold uppercase tracking-wider text-slate">Resolução</TableHead>
                  <TableHead scope="col" className="p-4 text-sm font-bold uppercase tracking-wider text-slate">Nota Interna</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-base text-slate">
                {resolvedReports.map(rep => (
                  <TableRow key={rep.id}>
                    <TableCell className="p-4">
                      <span className="text-sm font-bold text-sky uppercase">{rep.type}</span>
                      <p className="line-clamp-2 max-w-xs leading-relaxed">{rep.preview}</p>
                    </TableCell>
                    <TableCell className="p-4">
                      {rep.status === 'RESOLVED_KEPT' && <StatusBadge status="neutral"><Check className="w-3 h-3" /> Mantido</StatusBadge>}
                      {rep.status === 'RESOLVED_WARNED' && <StatusBadge status="warning"><AlertTriangle className="w-3 h-3" /> Advertido</StatusBadge>}
                      {rep.status === 'RESOLVED_REMOVED' && <StatusBadge status="error"><Trash2 className="w-3 h-3" /> Removido</StatusBadge>}
                    </TableCell>
                    <TableCell className="p-4 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{rep.notes}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
