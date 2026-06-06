import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { Camera, Save, MapPin, BookOpen, MessageSquare } from 'lucide-react';
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
  } = useProfile(id, profile);

  if (loading) return <div className="py-12 text-center text-slate">Carregando perfil...</div>;
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
             {isOwnProfile && isEditing && (
                <div className="absolute inset-0 bg-navy/60 flex flex-col items-center justify-center text-white transition-opacity pointer-events-none">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-center px-2 tracking-wider">Mudar Foto</span>
                </div>
             )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="font-serif text-3xl font-bold text-navy mb-1">{user.name}</h1>
            <p className="text-sm font-medium text-slate opacity-80 mb-6">{user.role === 'MEMBRO_ATIVO' ? 'Membro Ativo' : user.role === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador'} • OFC</p>
            
            {!isEditing ? (
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
            ) : (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-avatar" className="block text-xs uppercase tracking-widest font-bold text-sky">URL da Foto de Perfil</label>
                  <input 
                    id="profile-avatar"
                    type="url" 
                    className="w-full h-11 border border-border-gray px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none text-sm transition-colors"
                    placeholder="https://sua-imagem.com/foto.jpg"
                    value={editForm.avatarUrl}
                    onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-lotacao" className="block text-xs uppercase tracking-widest font-bold text-sky">Lotação Atual</label>
                  <input 
                    id="profile-lotacao"
                    type="text" 
                    className="w-full h-11 border border-border-gray px-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none text-sm transition-colors"
                    placeholder="Ex: Embaixada em Washington"
                    value={editForm.currentPost}
                    onChange={e => setEditForm({ ...editForm, currentPost: e.target.value })}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-bio" className="block text-xs uppercase tracking-widest font-bold text-sky">Biografia</label>
                  <textarea 
                    id="profile-bio"
                    className="w-full min-h-[120px] border border-border-gray p-3 text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none text-sm leading-relaxed resize-y transition-colors"
                    placeholder="Conte um pouco sobre sua trajetória profissional, postos anteriores, áreas de interesse..."
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-gray/50">
                   <button 
                     type="button" 
                     onClick={() => setIsEditing(false)}
                     className="px-6 py-2.5 min-h-[44px] text-navy text-sm font-medium border border-transparent hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none w-full sm:w-auto text-center"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     disabled={saving}
                     className="px-6 py-2.5 min-h-[44px] bg-navy text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-navy-dark transition-colors focus:ring-2 focus:ring-navy focus:outline-none disabled:opacity-50 w-full sm:w-auto"
                   >
                     {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Alterações</>}
                   </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
