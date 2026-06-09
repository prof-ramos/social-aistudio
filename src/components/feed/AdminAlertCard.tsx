import React from 'react';
import { Link } from 'react-router-dom';

export function AdminAlertCard() {
  return (
    <div className="bg-navy p-6 text-white shadow-sm font-sans">
      <h3 className="font-serif text-2xl mb-2 text-white">Área Administrativa</h3>
      <p className="text-sm opacity-90 mb-6 leading-relaxed">Você possui requisições de membros pendentes para análise ou denúncias na central de moderação.</p>
      <Link 
        to="/admin/membros" 
        className="block min-h-[44px] bg-white text-navy py-2.5 font-bold text-xs hover:bg-ice transition-colors text-center focus:ring-2 focus:ring-navy focus:outline-none"
      >
        GERENCIAR MEMBROS
      </Link>
    </div>
  );
}
