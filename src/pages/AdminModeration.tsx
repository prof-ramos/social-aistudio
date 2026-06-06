import React from 'react';
import { ShieldAlert, Check, X, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminModeration } from '../hooks/useAdminModeration';

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

  if (loading) return <div className="p-8 text-center text-slate">Carregando painel de moderação...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 w-full">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy mb-2">Moderação</h1>
        <p className="text-slate">Gerencie denúncias de conteúdo publicadas na plataforma.</p>
      </div>

      <div className="bg-white border border-border-gray shadow-sm h-[600px] flex flex-col">
        {pendingReports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate">
            <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
            <p>Nenhuma denúncia pendente.</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ice border-b border-border-gray text-xs font-bold uppercase tracking-wider text-slate">
                  <th className="p-4">Conteúdo</th>
                  <th className="p-4">Motivo / Denunciante</th>
                  <th className="p-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {pendingReports.map(rep => (
                  <tr key={rep.id} className="hover:bg-ice/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-sky uppercase tracking-wider mb-1">{rep.type}</span>
                        <p className="text-sm text-slate overflow-hidden text-ellipsis line-clamp-3">{rep.preview}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-navy">{rep.reason}</p>
                      <p className="text-xs text-slate opacity-70">Por: {rep.reportedBy}</p>
                    </td>
                    <td className="p-4">
                      {resolvingId === rep.id ? (
                        <form onSubmit={(e) => handleResolve(rep.id, e)} className="bg-ice p-3 rounded-md border border-border-gray space-y-3 min-w-[250px]">
                          <div>
                            <label className="block text-xs font-bold text-slate mb-1">Ação</label>
                            <select 
                              className="w-full h-9 border border-border-gray rounded text-sm px-2 focus:ring-1 focus:ring-navy focus:outline-none"
                              value={action}
                              onChange={e => setAction(e.target.value as any)}
                            >
                              <option value="RESOLVED_KEPT">Manter Conteúdo (Rejeitar Denúncia)</option>
                              <option value="RESOLVED_WARNED">Advertir Autor (Manter Conteúdo)</option>
                              <option value="RESOLVED_REMOVED">Remover Conteúdo (Ocultar)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate mb-1">Nota Interna (Obrigatório)</label>
                            <textarea 
                              required
                              className="w-full min-h-[60px] border border-border-gray rounded text-sm p-2 focus:ring-1 focus:ring-navy focus:outline-none resize-none"
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              placeholder="Descreva a razão da decisão..."
                            ></textarea>
                          </div>
                          <div className="flex gap-2">
                             <button type="button" onClick={() => setResolvingId(null)} className="flex-1 py-1.5 text-xs font-bold text-slate hover:bg-white border border-transparent transition-colors rounded">Cancelar</button>
                             <button type="submit" className="flex-1 py-1.5 text-xs font-bold bg-navy text-white hover:bg-navy-dark transition-colors rounded flex items-center justify-center gap-1">Confirmar <ArrowRight className="w-3 h-3" /></button>
                          </div>
                        </form>
                      ) : (
                        <button 
                          onClick={() => { setResolvingId(rep.id); setNotes(''); setAction('RESOLVED_KEPT'); }}
                          className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-md hover:bg-navy-dark transition-colors focus:ring-2 focus:ring-navy focus:outline-none"
                        >
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resolvedReports.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-navy mb-4">Histórico de Moderação</h2>
          <div className="bg-white border border-border-gray shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ice border-b border-border-gray text-xs font-bold uppercase tracking-wider text-slate">
                    <th className="p-4">Conteúdo</th>
                    <th className="p-4">Resolução</th>
                    <th className="p-4">Nota Interna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray text-sm text-slate">
                  {resolvedReports.map(rep => (
                    <tr key={rep.id}>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-sky uppercase">{rep.type}</span>
                        <p className="line-clamp-2 max-w-xs">{rep.preview}</p>
                      </td>
                      <td className="p-4">
                        {rep.status === 'RESOLVED_KEPT' && <span className="inline-flex items-center gap-1 text-slate bg-slate/10 px-2 py-1 rounded text-xs font-bold"><Check className="w-3 h-3" /> Mantido</span>}
                        {rep.status === 'RESOLVED_WARNED' && <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold"><AlertTriangle className="w-3 h-3" /> Advertido</span>}
                        {rep.status === 'RESOLVED_REMOVED' && <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><Trash2 className="w-3 h-3" /> Removido</span>}
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="line-clamp-2">{rep.notes}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
