import { Check, X } from 'lucide-react';
import { useAdminMembers } from '../hooks/useAdminMembers';

export function AdminMembers() {
  const { requests, handleApprove, handleReject } = useAdminMembers();

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-navy mb-8">Painel Admin: Membros</h1>
      
      <div className="bg-white border border-border-gray shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ice border-b border-border-gray text-navy">
                <th className="py-4 px-6 font-semibold text-sm">Nome / E-mail</th>
                <th className="py-4 px-6 font-semibold text-sm">Matrícula / CPF</th>
                <th className="py-4 px-6 font-semibold text-sm">Categoria</th>
                <th className="py-4 px-6 font-semibold text-sm">Posto</th>
                <th className="py-4 px-6 font-semibold text-sm">Status</th>
                <th className="py-4 px-6 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={6} className="py-8 px-6 text-center text-slate">Nenhuma solicitação encontrada.</td></tr>
              )}
              {requests.map(req => (
                <tr key={req.id} className="border-b border-border-gray hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-medium text-navy">{req.name}</p>
                    <p className="text-xs text-slate">{req.email}</p>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate">
                    <p>{req.matricula}</p>
                    <p className="text-xs opacity-70">{req.cpf}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-semibold px-2 py-1 rounded-sm bg-sky/20 text-navy">
                      {req.category === 'MEMBRO_ATIVO' ? 'ATIVA' : 'APOSENTADO'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate">{req.currentPost || '-'}</td>
                  <td className="py-4 px-6">
                    {req.status === 'PENDING' && <span className="text-sm font-medium text-amber-600">Pendente</span>}
                    {req.status === 'APPROVED' && <span className="text-sm font-medium text-green-600">Aprovado</span>}
                    {req.status === 'REJECTED' && <span className="text-sm font-medium text-red-600">Rejeitado</span>}
                  </td>
                  <td className="py-4 px-6">
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(req)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-green-50 text-green-700 hover:bg-green-100 rounded-sm border border-green-200 transition-colors focus:ring-2 focus:ring-green-700 focus:outline-none" title="Aprovar">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(req.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-red-50 text-red-700 hover:bg-red-100 rounded-sm border border-red-200 transition-colors focus:ring-2 focus:ring-red-700 focus:outline-none" title="Rejeitar">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
