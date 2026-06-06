import React from 'react';
import { UserProfile } from '../types';
import { Pin, ThumbsUp, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEditor } from '../components/feed/PostEditor';
import { ReactionButtons } from '../components/feed/ReactionButtons';
import { useFeed } from '../hooks/useFeed';

export function Feed({ profile }: { profile: UserProfile }) {
  const {
    filteredPosts,
    isPosting,
    showEditor,
    setShowEditor,
    filterCategory,
    setFilterCategory,
    search,
    setSearch,
    handleCreatePost
  } = useFeed(profile);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <h1 className="text-4xl text-navy font-serif">Feed da Comunidade</h1>
        <button onClick={() => setShowEditor(!showEditor)} className="bg-navy text-white px-6 py-3 font-medium cursor-pointer">
          NOVO POST
        </button>
      </div>

        {showEditor && (
          <PostEditor 
            onCancel={() => setShowEditor(false)} 
            onSubmit={handleCreatePost} 
            isPosting={isPosting} 
          />
        )}

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input 
          type="text" 
          placeholder="Buscar no feed..."
          className="flex-1 h-11 border border-border-gray px-3 text-sm text-slate focus:ring-1 focus:ring-navy focus:outline-none placeholder:text-slate/60"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select 
          className="h-11 border border-border-gray px-3 text-sm text-slate bg-white focus:ring-1 focus:ring-navy focus:outline-none"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="TODOS">Todas as Categorias</option>
          <option value="POSTOS">Postos</option>
          <option value="CARREIRA">Carreira</option>
          <option value="VIDA_EXTERIOR">Vida no Exterior</option>
          <option value="APOSENTADORIA">Aposentadoria</option>
          <option value="GERAL">Geral</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Feed List */}
        <div className="flex-1 space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate bg-white border border-dashed border-border-gray flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-navy" />
              <p className="font-serif text-xl text-navy mb-2">Nenhum post encontrado</p>
              <p className="text-sm opacity-80 max-w-sm mx-auto">Não encontramos publicações para sua busca ou categoria selecionada.</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className={`bg-white border p-6 relative transition-colors ${post.pinned ? 'border-sky shadow-sm bg-sky/5' : 'border-border-gray'}`}>
                 {post.pinned && (
                 <div className="absolute top-0 right-0 bg-sky text-navy px-3 py-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                   <Pin className="w-3 h-3" /> Fixado
                 </div>
               )}
               <div className="flex gap-4 mb-4">
                 <div className="w-12 h-12 bg-ice flex items-center justify-center font-bold text-navy shrink-0 uppercase">
                    {post.authorName ? post.authorName.charAt(0) : 'U'}
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-lg text-slate">
                     {post.authorName || 'Usuário'} <span className="text-xs font-normal text-slate/60">• {post.authorRole === 'MEMBRO_ATIVO' ? 'Membro Ativo' : post.authorRole === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Membro'}</span>
                   </h3>
                   <div className="flex items-center">
                     <p className="text-[10px] uppercase text-slate/50 font-medium">Postado em #{post.category}</p>
                   </div>
                 </div>
               </div>
               <Link to={`/feed/${post.id}`}>
                 <h4 className="font-bold text-navy mb-2 hover:text-sky transition-colors">{post.title}</h4>
               </Link>
               <div 
                 className="text-sm leading-relaxed mb-4 text-slate line-clamp-3 prose prose-slate prose-sm"
                 dangerouslySetInnerHTML={{ __html: post.body }}
               />
               
               <div className="flex gap-4 border-t border-border-gray pt-4">
                 <ReactionButtons postId={post.id} reactions={post.reactions} currentUserId={profile.id} />
                 <Link to={`/feed/${post.id}#comment`} className="text-xs font-semibold text-slate/50 flex items-center gap-1.5 hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px]">
                   <MessageSquare className="w-3.5 h-3.5" /> RESPONDER
                 </Link>
               </div>
            </div>
          )))}
        </div>
        
        {/* Right Sidebar Area */}
        <div className="w-full md:w-80 flex-none flex flex-col gap-6">
          {/* Posto Highlight Card */}
          <div className="bg-white border border-border-gray shadow-sm border-l-4 border-l-navy p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-serif text-xl text-navy">Posto: Genebra</h2>
              <span className="bg-red-50 text-red-700 border border-red-300 px-3 py-1 text-[10px] font-bold tracking-wider">DESATUALIZADO</span>
            </div>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-ice border border-border-gray">
                <p className="uppercase font-bold text-[9px] text-slate/60 mb-1">Segurança</p>
                <p className="italic">"Extremamente seguro, mas exige atenção redobrada em áreas turísticas durante o verão."</p>
                <p className="mt-2 font-semibold text-[10px] text-navy">— Relatado por: Ricardo P. (2019-2021)</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 border border-slate/10"><strong>Saúde:</strong> Excelente</div>
                <div className="p-2 border border-slate/10"><strong>Educação:</strong> Bilíngue</div>
                <div className="p-2 border border-slate/10"><strong>Custo Vida:</strong> Muito Alto</div>
                <div className="p-2 border border-slate/10"><strong>Moradia:</strong> Escassa</div>
              </div>
              <button className="w-full min-h-[44px] border border-navy text-navy font-medium py-2.5 px-3 rounded-md mt-2 transition-colors hover:bg-ice focus:ring-2 focus:ring-navy focus:outline-none">ATUALIZAR FICHA</button>
            </div>
          </div>

          {profile.role === 'ADMIN' && (
            <div className="bg-navy p-6 text-white shadow-sm">
              <h3 className="font-serif text-lg mb-2">Área Administrativa</h3>
              <p className="text-xs opacity-80 mb-4">Existem novas solicitações de acesso pendentes de aprovação.</p>
              <button onClick={() => window.location.href = '/admin/membros'} className="w-full min-h-[44px] bg-sky text-navy py-2.5 font-bold text-xs hover:bg-white transition-colors focus:ring-2 focus:ring-white focus:outline-none">
                GERENCIAR MEMBROS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
