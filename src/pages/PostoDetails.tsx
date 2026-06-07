import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { ChevronLeft, Plus, AlertTriangle } from 'lucide-react';
import { usePostoDetails } from '../hooks/usePostoDetails';

export function PostoDetails({ profile }: { profile: UserProfile }) {
  const { slug } = useParams();
  const {
    posto,
    fields,
    loading,
    isAddingField,
    setIsAddingField,
    newFieldType,
    setNewFieldType,
    newFieldBody,
    setNewFieldBody,
    handleAddField,
    handleReport
  } = usePostoDetails(slug, profile.id);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="w-40 h-5 bg-slate/10 mb-6" />
        <div className="bg-white border border-border-gray shadow-sm p-8 mb-8">
          <div className="w-64 h-10 bg-slate/10 mb-3" />
          <div className="w-48 h-6 bg-slate/10" />
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="w-48 h-8 bg-slate/10" />
          <div className="w-40 h-10 bg-slate/10" />
        </div>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-border-gray p-6">
              <div className="w-24 h-6 bg-slate/10 mb-4" />
              <div className="w-full h-4 bg-slate/10 mb-2" />
              <div className="w-3/4 h-4 bg-slate/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!posto) return <div className="py-12 text-center text-slate">Posto não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/postos" className="inline-flex items-center gap-2 text-navy hover:underline font-medium mb-6">
        <ChevronLeft className="w-4 h-4" /> Voltar para Postos
      </Link>
      
      <div className="bg-white border border-border-gray shadow-sm p-8 mb-8">
        <h1 className="font-serif text-4xl font-bold text-navy mb-2">{posto.name}</h1>
        <p className="text-lg text-slate">{posto.country} • {posto.region}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-serif text-2xl font-bold text-navy">Ficha do Posto</h2>
        <button 
          onClick={() => setIsAddingField(!isAddingField)}
          className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-navy text-white text-sm font-medium hover:bg-navy-dark transition-colors focus:ring-2 focus:ring-navy focus:outline-none"
        >
          <Plus className="w-4 h-4" /> Adicionar Relato
        </button>
      </div>

      {isAddingField && (
        <div className="bg-ice border border-border-gray p-6 mb-8">
           <form onSubmit={handleAddField}>
              <h3 className="font-bold text-navy mb-4">Novo Relato de Experiência</h3>
              <div className="mb-4">
                <label htmlFor="field-type" className="block text-sm font-medium text-slate mb-1">Tópico</label>
                <select id="field-type" className="w-full h-11 border border-border-gray rounded-md bg-white px-3 focus:ring-1 focus:ring-navy focus:outline-none" value={newFieldType} onChange={e=>setNewFieldType(e.target.value)}>
                   <option value="GERAL">Geral</option>
                   <option value="SEGURANCA">Segurança</option>
                   <option value="CUSTO_VIDA">Custo de Vida</option>
                   <option value="SAUDE">Saúde</option>
                   <option value="EDUCACAO">Educação</option>
                   <option value="MORADIA">Moradia</option>
                   <option value="TRANSPORTE">Transporte</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="field-body" className="block text-sm font-medium text-slate mb-1">Sua percepção</label>
                <textarea id="field-body" required className="w-full min-h-[120px] border border-border-gray rounded-md p-3 focus:ring-1 focus:ring-navy focus:outline-none" value={newFieldBody} onChange={e=>setNewFieldBody(e.target.value)}></textarea>
                <p className="text-xs text-slate mt-1 opacity-80">Por padrão, gravaremos seu período de experiência declarado no seu perfil.</p>
              </div>
              <div className="flex justify-end gap-3">
                 <button type="button" onClick={()=>setIsAddingField(false)} className="px-5 py-2.5 min-h-[44px] text-slate hover:bg-white transition-colors border border-transparent focus:ring-2 focus:ring-slate focus:outline-none">Cancelar</button>
                 <button type="submit" className="px-5 py-2.5 min-h-[44px] bg-navy text-white font-medium hover:bg-navy-dark transition-colors border border-navy focus:ring-2 focus:ring-navy focus:outline-none">Salvar</button>
              </div>
           </form>
        </div>
      )}

      <div className="space-y-6">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white border border-dashed border-border-gray">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-20 text-navy" />
            <p className="font-serif text-xl text-navy mb-2">Ficha em Branco</p>
            <p className="text-sm text-slate opacity-80 max-w-md mx-auto">Nenhuma contribuição nesta ficha ainda. Seja o primeiro a compartilhar sua experiência com os colegas!</p>
          </div>
        ) : (
          fields.map(field => (
             <div key={field.id} className="bg-white border border-border-gray p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-sky text-navy text-xs font-bold px-2 py-1 uppercase">{field.fieldType}</span>
                  <button 
                    onClick={() => handleReport('POSTO_FIELD', field.id, field.body)}
                    className="text-slate/30 hover:text-danger transition-colors p-2 focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[44px]"
                    title="Denunciar Relato"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate leading-relaxed mb-4">{field.body}</p>
                <div className="text-xs text-slate opacity-70 border-t border-border-gray pt-3">
                   {/* We would fetch author details here. For now, just show placeholder */}
                   Relato do Colega
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  );
}
