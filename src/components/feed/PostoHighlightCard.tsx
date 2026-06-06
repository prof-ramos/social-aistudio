import React from 'react';

export function PostoHighlightCard() {
  return (
    <div className="bg-white border border-border-gray shadow-sm border-l-4 border-l-navy p-6 font-sans">
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-serif text-2xl text-navy">Posto: Genebra</h2>
        <span className="bg-danger/10 text-danger border border-danger/30 px-3 py-1 text-[10px] font-bold tracking-wider uppercase">Desatualizado</span>
      </div>
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-ice border border-border-gray">
          <p className="uppercase font-bold text-[9px] text-slate/60 mb-1">Segurança</p>
          <p className="italic text-slate">"Extremamente seguro, mas exige atenção redobrada em áreas turísticas durante o verão."</p>
          <p className="mt-2 font-semibold text-[10px] text-navy">— Relatado por: Ricardo P. (2019-2021)</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate">
          <div className="p-2 border border-slate/10 bg-ice/30"><strong>Saúde:</strong> Excelente</div>
          <div className="p-2 border border-slate/10 bg-ice/30"><strong>Educação:</strong> Bilíngue</div>
          <div className="p-2 border border-slate/10 bg-ice/30"><strong>Custo Vida:</strong> Muito Alto</div>
          <div className="p-2 border border-slate/10 bg-ice/30"><strong>Moradia:</strong> Escassa</div>
        </div>
        <button className="w-full min-h-[44px] border border-navy text-navy font-bold text-xs uppercase tracking-wider py-2.5 px-3 hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none mt-2">
          Atualizar Ficha
        </button>
      </div>
    </div>
  );
}
