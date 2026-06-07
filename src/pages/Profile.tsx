import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { Camera, Save, MapPin, BookOpen, MessageSquare, Bookmark, X, Star } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

export function Profile({ profile }: { profile: UserProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    user,
    loading,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    saving,
    isOwnProfile,
    handleSave,
    savedPosts,
  } = useProfile(id, profile);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 w-full animate-pulse">
        <div className="w-64 h-10 bg-slate/10 mb-2" />
        <div className="bg-white border border-border-gray shadow-sm p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 bg-slate/10 shrink-0" />
            <div className="flex-1 w-full space-y-6 pt-2">
              <div>
                <div className="w-48 h-8 bg-slate/10 mb-2" />
                <div className="w-32 h-4 bg-slate/10" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="w-24 h-3 bg-slate/10 mb-2" />
                  <div className="w-32 h-8 bg-slate/10" />
                </div>
                <div>
                  <div className="w-32 h-3 bg-slate/10 mb-2" />
                  <div className="w-full h-16 bg-slate/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <div className="py-12 text-center text-slate">Usuário não encontrado.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-4xl text-navy font-serif">Perfil do Usuário</h1>
      </div>

      <div className="bg-white border border-border-gray shadow-sm p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
             <div className="w-32 h-32 bg-ice border-4 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 transition-opacity">
               {user.avatarUrl || editForm.avatarUrl ? (
                 <img src={isEditing ? editForm.avatarUrl || user.avatarUrl : user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-4xl font-bold text-navy uppercase">{user.name.charAt(0)}</span>
               )}
             </div>
             
             {/* Online Indicator */}
             {!isEditing && (
               <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-colors duration-500 z-10 ${user.isOnline ? 'bg-success' : 'bg-slate-300'}`} 
                 title={user.isOnline ? 'Online agora' : 'Offline'}
               />
             )}

             {isOwnProfile && isEditing && (
                <div className="absolute inset-0 bg-navy/60 flex flex-col items-center justify-center text-white transition-opacity pointer-events-none z-10">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-center px-2 tracking-wider">Mudar Foto</span>
                </div>
             )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="font-serif text-3xl font-bold text-navy mb-1">{user.name}</h1>
            <p className="text-sm font-medium text-slate opacity-80 mb-6">{user.role === 'MEMBRO_ATIVO' ? 'Membro Ativo' : user.role === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador'} • OFC</p>
            
            <div className="space-y-6">
              {user.currentPost && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sky flex items-center gap-1 mb-1">
                     <MapPin className="w-3 h-3" /> Lotação Atual
                  </span>
                  <p className="text-sm text-navy font-bold bg-ice inline-block px-3 py-1.5 border border-border-gray/50">{user.currentPost}</p>
                </div>
              )}
              {user.bio ? (
                <div>
                   <span className="text-[10px] uppercase font-bold tracking-widest text-sky flex items-center gap-1 mb-2">
                     <BookOpen className="w-3 h-3" /> Biografia e Trajetória
                   </span>
                   <p className="text-slate text-sm leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                </div>
              ) : (
                <p className="text-sm text-slate italic opacity-70">Nenhum detalhe de biografia ou trajetória profissional foi adicionado.</p>
              )}

              {(user as any).interests && (
                <div>
                   <span className="text-[10px] uppercase font-bold tracking-widest text-sky flex items-center gap-1 mb-2">
                     <Star className="w-3 h-3" /> Áreas de Interesse
                   </span>
                   <p className="text-slate text-sm leading-relaxed whitespace-pre-wrap">{(user as any).interests}</p>
                </div>
              )}
              
              {isOwnProfile ? (
                <div className="pt-4 border-t border-border-gray/50">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 min-h-[44px] border border-navy text-navy text-sm font-medium hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none"
                  >
                    Editar Perfil
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border-gray/50">
                  <button 
                    onClick={() => navigate('/mensagens', { state: { targetUserId: user.id, targetUserName: user.name } })}
                    className="px-6 py-2.5 min-h-[44px] bg-navy text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors focus:ring-2 focus:ring-navy focus:outline-none w-full sm:w-auto"
                  >
                    <MessageSquare className="w-4 h-4" /> Enviar Mensagem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl mx-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border-gray/50 bg-ice/30">
              <h2 className="font-serif text-2xl font-bold text-navy">Editar Perfil</h2>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate hover:text-navy transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-1"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" /> Fechar
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="edit-profile-form" onSubmit={handleSave} className="space-y-6">
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-avatar" className="block text-xs uppercase tracking-widest font-bold text-sky">URL da Foto de Perfil</label>
                  <input 
                    id="profile-avatar"
                    type="url" 
                    className="w-full h-11 border border-border-gray px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none text-sm transition-colors bg-white/50"
                    placeholder="https://sua-imagem.com/foto.jpg"
                    value={editForm.avatarUrl}
                    onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-bio" className="block text-xs uppercase tracking-widest font-bold text-sky">Mini-biografia</label>
                  <textarea 
                    id="profile-bio"
                    className="w-full min-h-[120px] border border-border-gray p-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none text-sm leading-relaxed resize-y transition-colors bg-white/50"
                    placeholder="Conte um pouco sobre sua trajetória profissional e postos anteriores..."
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  />
                  <p className="text-xs text-slate opacity-70">Escreva um breve resumo da sua carreira.</p>
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-interests" className="block text-xs uppercase tracking-widest font-bold text-sky">Áreas de Interesse</label>
                  <input 
                    id="profile-interests"
                    type="text" 
                    className="w-full h-11 border border-border-gray px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none text-sm transition-colors bg-white/50"
                    placeholder="Ex: Política Externa, Economia, Direitos Humanos"
                    value={editForm.interests}
                    onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border-gray/50 bg-ice/30 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
               <button 
                 type="button" 
                 onClick={() => setIsEditing(false)}
                 className="px-6 py-2.5 min-h-[44px] text-navy text-sm font-medium border border-transparent hover:bg-white transition-colors focus:ring-2 focus:ring-navy focus:outline-none w-full sm:w-auto text-center shadow-sm"
               >
                 Cancelar
               </button>
               <button 
                 type="submit"
                 form="edit-profile-form"
                 disabled={saving}
                 className="px-6 py-2.5 min-h-[44px] bg-navy text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-navy-dark transition-colors focus:ring-2 focus:ring-navy focus:outline-none disabled:opacity-50 w-full sm:w-auto shadow-sm"
               >
                 {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Alterações</>}
               </button>
            </div>
          </div>
        </div>
      )}

      {isOwnProfile && (
        <div className="bg-white border border-border-gray shadow-sm p-8 mt-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-gray/50 pb-4">
            <Bookmark className="w-5 h-5 text-navy" />
            <h2 className="font-serif text-2xl font-bold text-navy">Salvos</h2>
          </div>
          
          {savedPosts.length === 0 ? (
            <div className="text-center py-8">
               <Bookmark className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
               <p className="text-navy font-bold">Nenhum post salvo</p>
               <p className="text-sm text-slate mt-1">Os posts que você salvar aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedPosts.map(post => (
                <Link key={post.id} to={`/feed/${post.id}`} className="block border border-border-gray p-4 hover:border-navy hover:shadow-sm transition-all bg-ice/30">
                  <h3 className="font-bold text-navy mb-2 line-clamp-2">{post.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                     <p className="text-xs text-slate/80">Por {post.authorName || 'Usuário'}</p>
                     <span className="text-[10px] uppercase font-bold text-sky">{post.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
