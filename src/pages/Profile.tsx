import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { Camera, Save, MapPin, BookOpen, MessageSquare, Bookmark, X, Star } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { Card, PageTitle, Button, Alert, StatusBadge, Breadcrumb, AvatarUpload } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function Profile({ profile }: { profile: UserProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editDialogRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, setIsEditing]);

  useFocusTrap(editDialogRef, isEditing);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  if (loading) {
    return (
      <PageContainer variant="narrow" className="animate-pulse space-y-6">
        <div className="w-64 h-10 bg-slate/10 mb-2" />
        <Card variant="elevated" padding="lg">
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
        </Card>
      </PageContainer>
    );
  }
  if (!user) return (
    <PageContainer variant="narrow">
      <Alert variant="info">Usuário não encontrado.</Alert>
    </PageContainer>
  );

  const roleLabel = user.role === 'MEMBRO_ATIVO' ? 'Membro Ativo' : user.role === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador';
  const roleStatus: 'success' | 'neutral' | 'info' = user.role === 'MEMBRO_ATIVO' ? 'success' : user.role === 'MEMBRO_APOSENTADO' ? 'neutral' : 'info';

  return (
    <PageContainer variant="narrow" className="space-y-6">
      <Breadcrumb items={[{ label: 'Início', href: '/feed' }, { label: 'Perfil' }]} />
      <div className="flex items-end justify-between mb-2">
        <PageTitle as="h1" size="xl" id="posts">Perfil do Usuário</PageTitle>
      </div>

      <Card variant="elevated" padding="lg">
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
               <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-colors duration-500 z-10 ${user.isOnline ? 'bg-success' : 'bg-ice'}`}
                 title={user.isOnline ? 'Online agora' : 'Offline'}
               />
             )}

             {isOwnProfile && isEditing && (
                <div className="absolute inset-0 bg-navy/60 flex flex-col items-center justify-center text-white transition-opacity pointer-events-none z-10">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs uppercase font-bold text-center px-2 tracking-wider">Mudar Foto</span>
                </div>
             )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <PageTitle as="h2" size="lg" className="mb-1">{user.name}</PageTitle>
            <p className="text-sm font-medium text-slate opacity-80 mb-6"><StatusBadge status={roleStatus}>{roleLabel}</StatusBadge> • OFC</p>

            <div className="space-y-6">
              {user.currentPost && (
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-1">
                     <MapPin className="w-3 h-3" /> Lotação Atual
                  </span>
                  <p className="text-sm text-navy font-bold bg-ice inline-block px-3 py-1.5 border border-border-gray/50">{user.currentPost}</p>
                </div>
              )}
              {user.bio ? (
                <div>
                   <span className="text-xs uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-2">
                     <BookOpen className="w-3 h-3" /> Biografia e Trajetória
                   </span>
                   <p className="text-slate text-sm leading-relaxed whitespace-pre-wrap break-words">{user.bio}</p>
                </div>
              ) : (
                <p className="text-sm text-slate italic opacity-70">Nenhum detalhe de biografia ou trajetória profissional foi adicionado.</p>
              )}

              {user.interests && (
                <div>
                   <span className="text-xs uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-2">
                     <Star className="w-3 h-3" /> Áreas de Interesse
                   </span>
                   <p className="text-slate text-sm leading-relaxed whitespace-pre-wrap break-words">{user.interests}</p>
                </div>
              )}

              {isOwnProfile ? (
                <div className="pt-4 border-t border-border-gray/50">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar Perfil
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border-gray/50">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    className="sm:w-auto"
                    onClick={() => navigate('/mensagens', { state: { targetUserId: user.id, targetUserName: user.name } })}
                  >
                    <MessageSquare className="w-4 h-4" /> Enviar Mensagem
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div
            ref={editDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="mx-auto flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-border-gray/50 bg-ice/30">
              <PageTitle as="h2" size="lg" id="edit-profile-title">Editar Perfil</PageTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" /> Fechar
              </Button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="edit-profile-form" onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center gap-2 text-left">
                  <AvatarUpload
                    currentAvatarUrl={editForm.avatarUrl || user.avatarUrl}
                    userName={user.name}
                    userId={user.id}
                    onUploadComplete={(url) => setEditForm({ ...editForm, avatarUrl: url })}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-bio" className="block text-xs uppercase tracking-widest font-bold text-navy">Mini-biografia</label>
                  <textarea
                    id="profile-bio"
                    className="w-full min-h-[120px] border border-border-gray p-3 text-base text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none leading-relaxed resize-y transition-colors bg-white/50"
                    placeholder="Conte um pouco sobre sua trajetória profissional e postos anteriores..."
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  />
                  <p className="text-xs text-slate opacity-70">Escreva um breve resumo da sua carreira.</p>
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-interests" className="block text-xs uppercase tracking-widest font-bold text-navy">Áreas de Interesse</label>
                  <input
                    id="profile-interests"
                    type="text"
                    className="w-full h-11 border border-border-gray px-3 text-base text-slate focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-colors bg-white/50"
                    placeholder="Ex: Política Externa, Economia, Direitos Humanos"
                    value={editForm.interests}
                    onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-border-gray/50 bg-ice/30 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
               <Button
                 type="button"
                 variant="ghost"
                 size="md"
                 onClick={() => setIsEditing(false)}
                 className="w-full sm:w-auto"
               >
                 Cancelar
               </Button>
               <Button
                 type="submit"
                 form="edit-profile-form"
                 disabled={saving}
                 isLoading={saving}
                 size="md"
                 className="w-full sm:w-auto"
               >
                 <Save className="w-4 h-4" /> Salvar Alterações
               </Button>
            </div>
          </div>
        </div>
      )}

      {isOwnProfile && (
        <Card variant="elevated" padding="lg" className="mt-6">
          <div id="salvos" className="flex items-center gap-2 mb-6 border-b border-border-gray/50 pb-4">
            <Bookmark className="w-5 h-5 text-navy" />
            <PageTitle as="h2" size="lg">Salvos</PageTitle>
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
                     <p className="text-xs text-muted">Por {post.authorName || 'Usuário'}</p>
                     <span className="text-xs uppercase font-bold text-navy">{post.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </PageContainer>
  );
}
