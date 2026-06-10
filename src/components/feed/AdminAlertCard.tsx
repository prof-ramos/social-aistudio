import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';

export function AdminAlertCard() {
  return (
    <div className="bg-white border border-border-gray shadow-sm p-5 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-navy/5 rounded-bl-full" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-navy" strokeWidth={2} />
          <h3 className="font-bold text-sm text-navy uppercase tracking-wider">Área Administrativa</h3>
        </div>
        <p className="text-sm text-slate leading-relaxed mb-4">Você possui requisições de membros pendentes para análise ou denúncias na central de moderação.</p>
        <Link
          to="/admin/membros"
          className="block min-h-[44px] bg-navy text-white py-2.5 font-bold text-sm hover:bg-navy-dark transition-colors text-center focus:ring-2 focus:ring-navy focus:outline-none"
        >
          <span className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" strokeWidth={1.5} />
            Gerenciar Membros
          </span>
        </Link>
      </div>
    </div>
  );
}
