import React from 'react';
import { UserProfile } from '../../types';
import { Link } from 'react-router-dom';
import { FileEdit, Bookmark, Compass } from 'lucide-react';

interface LeftSidebarProps {
  profile: UserProfile;
}

export function LeftSidebar({ profile }: LeftSidebarProps) {
  return (
    <div className="flex w-full flex-none flex-col gap-8 xl:w-[300px] xl:sticky xl:top-16">
      {/* Mini Profile Card */}
      <div className="bg-white border border-border-gray shadow-sm overflow-hidden flex flex-col items-center">
        <div className="h-24 bg-navy w-full relative">
          <Link to={`/perfil/${profile.id}`} className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-ice border-4 border-white shadow-sm flex items-center justify-center font-bold text-3xl text-navy uppercase hover:opacity-90 transition-opacity">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile.name.charAt(0)
            )}
            {/* Online Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white shadow-sm transition-colors duration-500 z-10 ${profile.isOnline ? 'bg-success' : 'bg-slate-300'}`} 
              title={profile.isOnline ? 'Online agora' : 'Offline'}
            />
          </Link>
        </div>
        <div className="px-6 pb-6 pt-14 w-full flex flex-col items-center text-center">
          <Link to={`/perfil/${profile.id}`}>
            <h2 className="font-serif text-xl font-bold text-navy hover:text-sky transition-colors">{profile.name}</h2>
          </Link>
          <p className="text-xs text-slate uppercase tracking-wider mt-1">{profile.role === 'MEMBRO_ATIVO' ? 'Membro Ativo' : profile.role === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador'}</p>
          
          <div className="mt-6 pt-4 border-t border-border-gray/50 flex gap-4 text-center w-full">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-slate/50">Posts</p>
              <p className="font-serif text-lg text-navy">12</p>
            </div>
            <div className="flex-1 border-l border-border-gray/50">
              <p className="text-[10px] uppercase font-bold text-slate/50">Salvos</p>
              <p className="font-serif text-lg text-navy">{profile.savedPosts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-border-gray shadow-sm font-sans">
        <Link to={`/perfil/${profile.id}#posts`} className="flex items-center gap-3 p-4 border-b border-border-gray/50 hover:bg-ice transition-colors text-sm font-medium text-slate hover:text-navy">
          <FileEdit className="w-4 h-4 text-slate/50" strokeWidth={1.5} />
          Minhas Publicações
        </Link>
        <Link to={`/perfil/${profile.id}#salvos`} className="flex items-center gap-3 p-4 border-b border-border-gray/50 hover:bg-ice transition-colors text-sm font-medium text-slate hover:text-navy">
          <Bookmark className="w-4 h-4 text-slate/50" strokeWidth={1.5} />
          Itens Salvos
        </Link>
        <Link to="/postos" className="flex items-center gap-3 p-4 hover:bg-ice transition-colors text-sm font-medium text-slate hover:text-navy">
          <Compass className="w-4 h-4 text-slate/50" strokeWidth={1.5} />
          Explorar Postos
        </Link>
      </div>
    </div>
  );
}
