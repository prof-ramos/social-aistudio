import { Check, X } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useAdminMembers } from '../hooks/useAdminMembers';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { useConfirm } from '../hooks/useConfirm.tsx';
import { PageContainer } from '../components/layout/PageContainer';

export function AdminMembers() {
  const { requests, handleApprove, handleReject } = useAdminMembers();
  const { confirm, dialog } = useConfirm();

  return (
    <PageContainer variant="feed" className="space-y-8">
      <Breadcrumb items={[{ label: 'Início', href: '/feed' }, { label: 'Admin', href: '/admin' }, { label: 'Membros' }]} />
      <h1 className="font-serif text-3xl font-bold text-navy mb-8">Painel Admin: Membros</h1>
      
      <div className="bg-white border border-border-gray shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ice border-b border-border-gray text-navy">
                <th className="py-4 px-6 font-semibold text-base">Nome / E-mail</th>
                <th className="py-4 px-6 font-semibold text-base">Matrícula / CPF</th>
                <th className="py-4 px-6 font-semibold text-base">Categoria</th>
                <th className="py-4 px-6 font-semibold text-base">Posto</th>
                <th className="py-4 px-6 font-semibold text-base">Status</th>
                <th className="py-4 px-6 font-semibold text-base">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="py-12 px-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-ice flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-success" />
                    </div>
                    <p className="text-base font-medium text-navy mb-1 leading-relaxed">Nenhuma solicitação pendente</p>
                    <p className="text-sm text-slate max-w-sm leading-relaxed">Todas as solicitações de acesso foram processadas. Novas solicitações aparecerão aqui automaticamente.</p>
                  </div>
                </td></tr>
              )}
              {requests.map(req => (
                <tr key={req.id} className="border-b border-border-gray hover:bg-ice/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-medium text-navy leading-relaxed">{req.name}</p>
                    <p className="text-sm text-slate leading-relaxed">{req.email}</p>
                  </td>
                  <td className="py-4 px-6 text-base text-slate">
                    <p>{req.matricula}</p>
                    <p className="text-sm text-slate font-medium leading-relaxed">{req.cpf}</p>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={req.category === 'MEMBRO_ATIVO' ? 'info' : 'neutral'}>
                      {req.category === 'MEMBRO_ATIVO' ? 'ATIVA' : 'APOSENTADO'}
                    </StatusBadge>
                  </td>
                  <td className="py-4 px-6 text-base text-slate">{req.currentPost || '-'}</td>
                  <td className="py-4 px-6">
                    {req.status === 'PENDING' && <StatusBadge status="warning">Pendente</StatusBadge>}
                    {req.status === 'APPROVED' && <StatusBadge status="success">Aprovado</StatusBadge>}
                    {req.status === 'REJECTED' && <StatusBadge status="error">Rejeitado</StatusBadge>}
                  </td>
                  <td className="py-4 px-6">
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            const { confirmed } = await confirm({
                              title: 'Aprovar solicitação',
                              message: `Deseja aprovar o acesso para ${req.name}? O usuário poderá se registrar no sistema.`,
                              confirmLabel: 'Aprovar',
                              cancelLabel: 'Cancelar',
                              variant: 'info',
                            });
                            if (confirmed) handleApprove(req);
                          }}
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] text-success hover:bg-success/10 hover:text-success border border-success/20"
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={async () => {
                            const { confirmed, inputValue } = await confirm({
                              title: 'Rejeitar solicitação',
                              message: `Deseja rejeitar o acesso para ${req.name}? Esta ação não pode ser desfeita.`,
                              confirmLabel: 'Rejeitar',
                              cancelLabel: 'Cancelar',
                              variant: 'danger',
                              inputLabel: 'Justificativa da rejeição',
                              inputPlaceholder: 'Informe o motivo da rejeição...',
                              inputRequired: true,
                            });
                            if (confirmed) handleReject(req.id, inputValue);
                          }}
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] text-danger hover:bg-danger/10 hover:text-danger border border-danger/20"
                          title="Rejeitar"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {dialog}
    </PageContainer>
  );
}
