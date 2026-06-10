import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { Camera, Save, MapPin, BookOpen, MessageSquare, Bookmark, X, Star, Lock, Phone, Mail, FileEdit } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserContent } from '../hooks/useUserContent';
import { useEditProfile } from '../hooks/useEditProfile';
import { Card, PageTitle, Button, Alert, StatusBadge, Breadcrumb, AvatarUpload, Checkbox } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function Profile({ profile }: { profile: UserProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editDialogRef = useRef<HTMLDivElement>(null);
  const { user, loading, isOwnProfile } = useUserProfile(id, profile);
  const { savedPosts, userPosts } = useUserContent(user, id);
  const { isEditing, setIsEditing, editForm, setEditForm, saving, handleSave } = useEditProfile(user, id, isOwnProfile);

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
    if (loading || !user) return;
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [loading, user]);

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
  const isViewingOwnProfile = profile.id === id;
  // users_public view is the authoritative filter; this is defense-in-depth
  const visiblePhone = user.showPhone && user.phone;
  const visibleEmail = user.showEmail && user.email;

  return (
    <PageContainer variant="narrow" className="space-y-6">
      <Breadcrumb items={[{ label: 'Início', href: '/feed' }, { label: 'Perfil' }]} />
      <div className="flex items-end justify-between mb-2">
        <PageTitle as="h1" size="xl">Perfil do Usuário</PageTitle>
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
                  <span className="text-sm uppercase font-bold text-center px-2 tracking-wider">Mudar Foto</span>
                </div>
             )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <h2 className="font-serif font-bold text-navy text-3xl mb-1">{user.name}</h2>
            <p className="text-base font-medium text-slate mb-6 leading-relaxed"><StatusBadge status={roleStatus}>{roleLabel}</StatusBadge> • OFC</p>

            <div className="space-y-6">
              {user.currentPost && (
                <div>
                  <span className="text-sm uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-1">
                     <MapPin className="w-3 h-3" /> Lotação Atual
                  </span>
                  <p className="text-base text-navy font-bold bg-ice inline-block px-3 py-1.5 border border-border-gray/50 leading-relaxed">{user.currentPost}</p>
                </div>
              )}
              {user.bio ? (
                <div>
                   <span className="text-sm uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-2">
                     <BookOpen className="w-3 h-3" /> Biografia e Trajetória
                   </span>
                   <p className="text-slate text-base leading-relaxed whitespace-pre-wrap break-words">{user.bio}</p>
                </div>
              ) : (
                <p className="text-base text-slate italic leading-relaxed">Nenhum detalhe de biografia ou trajetória profissional foi adicionado.</p>
              )}

              {visiblePhone || visibleEmail ? (
                <div>
                  <span className="text-sm uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-2">
                    <Phone className="w-3 h-3" /> Contato
                  </span>
                  <div className="space-y-2">
                    {visiblePhone && (
                      <p className="text-base text-slate leading-relaxed flex items-center gap-2">
                        <Phone className="w-4 h-4 text-navy" />
                        {user.phone}
                        {user.phoneIsWhatsapp && <span className="text-sm font-medium text-slate">(WhatsApp)</span>}
                      </p>
                    )}
                    {visibleEmail && (
                      <p className="text-base text-slate leading-relaxed flex items-center gap-2">
                        <Mail className="w-4 h-4 text-navy" />
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {user.interests && (
                <div>
                   <span className="text-sm uppercase font-bold tracking-widest text-navy flex items-center gap-1 mb-2">
                     <Star className="w-3 h-3" /> Áreas de Interesse
                   </span>
                   <p className="text-slate text-base leading-relaxed whitespace-pre-wrap break-words">{user.interests}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4 modal-contain">
          <div
            ref={editDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="mx-auto flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-lg"
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
                  <label htmlFor="profile-bio" className="block text-sm uppercase tracking-widest font-bold text-navy">Mini-biografia</label>
                  <textarea
                    id="profile-bio"
                    autoComplete="off"
                    className="w-full min-h-[120px] border border-border-gray p-3 text-base text-slate focus:border-navy focus:ring-2 focus:ring-navy focus:outline-none leading-relaxed resize-y max-h-[400px] transition-colors bg-white/50"
                    placeholder="Conte um pouco sobre sua trajetória profissional e postos anteriores..."
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  />
                  <p className="text-sm text-slate font-medium leading-relaxed">Escreva um breve resumo da sua carreira.</p>
                </div>
                <div className="space-y-1 text-left">
                  <label htmlFor="profile-interests" className="block text-sm uppercase tracking-widest font-bold text-navy">Áreas de Interesse</label>
                  <input
                    id="profile-interests"
                    type="text"
                    autoComplete="off"
                    enterKeyHint="done"
                    className="w-full h-11 border border-border-gray px-3 text-base text-slate focus:border-navy focus:ring-2 focus:ring-navy focus:outline-none transition-colors bg-white/50"
                    placeholder="Ex: Política Externa, Economia, Direitos Humanos"
                    value={editForm.interests}
                    onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                  />
                </div>

                <div className="space-y-4 text-left border-t border-border-gray/50 pt-6">
                  <h3 className="text-base font-bold text-navy">Informações de Contato</h3>
                  <p className="text-base text-slate leading-relaxed flex items-start gap-2">
                    <Lock className="w-4 h-4 text-navy shrink-0 mt-1" />
                    Usamos seus dados de contato apenas para que colegas possam falar com você. Seu dado não será compartilhado sem sua autorização.
                  </p>
                  <div className="space-y-1">
                    <label htmlFor="profile-phone" className="block text-sm uppercase tracking-widest font-bold text-navy">Telefone</label>
                    <input
                      id="profile-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      className="w-full h-11 border border-border-gray px-3 text-base text-slate focus:border-navy focus:ring-2 focus:ring-navy focus:outline-none transition-colors bg-white/50"
                      placeholder="(61) 99999-9999"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="profile-email" className="block text-sm uppercase tracking-widest font-bold text-navy">E-mail</label>
                    <input
                      id="profile-email"
                      type="email"
                      readOnly
                      className="w-full h-11 border border-border-gray px-3 text-base text-slate bg-ice/50 cursor-not-allowed"
                      value={user.email}
                    />
                  </div>
                  <Checkbox
                    id="profile-phone-whatsapp"
                    label="Este número é WhatsApp"
                    checked={editForm.phoneIsWhatsapp}
                    onChange={e => setEditForm({ ...editForm, phoneIsWhatsapp: e.target.checked })}
                  />
                  <Checkbox
                    id="profile-show-phone"
                    label="Mostrar meu telefone publicamente"
                    checked={editForm.showPhone}
                    onChange={e => setEditForm({ ...editForm, showPhone: e.target.checked })}
                  />
                  <Checkbox
                    id="profile-show-email"
                    label="Mostrar meu e-mail publicamente"
                    checked={editForm.showEmail}
                    onChange={e => setEditForm({ ...editForm, showEmail: e.target.checked })}
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

      <Card variant="elevated" padding="lg" className="mt-6">
          <div id="posts" className="flex items-center gap-2 mb-6 border-b border-border-gray/50 pb-4">
            <FileEdit className="w-5 h-5 text-navy" />
            <PageTitle as="h3" size="lg">{isViewingOwnProfile ? 'Minhas Publicações' : 'Publicações'}</PageTitle>
          </div>

          {userPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileEdit className="w-12 h-12 mx-auto text-slate mb-3" />
              <p className="text-navy font-bold leading-relaxed">Nenhuma publicação ainda</p>
              <p className="text-base text-slate mt-1 leading-relaxed">
                {isViewingOwnProfile
                  ? 'As publicações que você criar aparecerão aqui.'
                  : 'Este membro ainda não publicou nada.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userPosts.map(post => (
                <Link key={post.id} to={`/feed/${post.id}`} className="block min-h-[44px] border border-border-gray p-4 hover:border-navy hover:shadow-sm transition-all bg-ice/30">
                  <h3 className="font-bold text-navy mb-2 line-clamp-2">{post.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-sm text-slate leading-relaxed">{post.category}</p>
                    <span className="text-sm uppercase font-bold text-navy">Ver post</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

      {isOwnProfile && (
        <Card variant="elevated" padding="lg" className="mt-6">
          <div id="salvos" className="flex items-center gap-2 mb-6 border-b border-border-gray/50 pb-4">
            <Bookmark className="w-5 h-5 text-navy" />
            <PageTitle as="h3" size="lg">Salvos</PageTitle>
          </div>

          {savedPosts.length === 0 ? (
            <div className="text-center py-8">
               <Bookmark className="w-12 h-12 mx-auto text-slate mb-3" />
               <p className="text-navy font-bold leading-relaxed">Nenhum post salvo</p>
               <p className="text-base text-slate mt-1 leading-relaxed">Os posts que você salvar aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedPosts.map(post => (
                <Link key={post.id} to={`/feed/${post.id}`} className="block min-h-[44px] border border-border-gray p-4 hover:border-navy hover:shadow-sm transition-all bg-ice/30">
                  <h3 className="font-bold text-navy mb-2 line-clamp-2">{post.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                     <p className="text-sm text-slate leading-relaxed">Por {post.authorName || 'Usuário'}</p>
                     <span className="text-sm uppercase font-bold text-navy">{post.category}</span>
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
