import React, { useEffect, useState } from 'react';
import { sanitizeHtml } from '../lib/sanitize';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, Post } from '../types';
import { ArrowLeft, MessageSquare, ThumbsUp, AlertTriangle, Bookmark, Pencil, Trash2 } from 'lucide-react';
import { usePostDetails } from '../hooks/usePostDetails';
import { postService } from '../services/postService';
import { PostEditor } from '../components/feed/PostEditor';
import { ReactionButtons } from '../components/feed/ReactionButtons';
import { userService } from '../services/userService';
import { Card, PageTitle, Button, Alert, Breadcrumb } from '../components/ui';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ReportDialog } from '../components/ui/ReportDialog';
import { PageContainer } from '../components/layout/PageContainer';
import { useToast } from '../components/ui/Toast';

export default function PostDetails({ profile }: { profile: UserProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    post,
    setPost,
    comments,
    newCommentBody,
    setNewCommentBody,
    loading,
    isPosting,
    handleAddComment,
    handleReport,
    reportTarget,
    setReportTarget,
    submitReport,
    handleDeletePost
  } = usePostDetails(id, profile);

  const canModify = post && (post.authorId === profile.id || profile.role === 'ADMIN');

  const toggleSaved = async () => {
    if (!post) return;
    try {
      await userService.toggleSavedPost(profile.id, post.id);
      if (!profile.savedPosts) profile.savedPosts = [];
      if (profile.savedPosts.includes(post.id)) {
        profile.savedPosts = profile.savedPosts.filter(id => id !== post.id);
      } else {
        profile.savedPosts.push(post.id);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await handleDeletePost();
      navigate('/feed');
    } catch (e) {
      // Error toast already shown by handleDeletePost
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditComplete = (updatedPost?: Post) => {
    if (updatedPost) setPost(updatedPost);
    setIsEditing(false);
  };

  useEffect(() => {
    if (location.hash === '#comment' && !loading && post) {
      setTimeout(() => {
        const el = document.getElementById('comment-body');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [location.hash, loading, post]);

  if (loading) {
    return (
      <PageContainer variant="detail" className="animate-pulse space-y-8 pb-12">
        <div className="w-24 h-6 bg-slate/10" />
        <Card variant="elevated" padding="lg">
          <div className="flex gap-4 mb-6">
            <div className="w-12 h-12 bg-slate/10 shrink-0" />
            <div className="flex-1">
              <div className="w-48 h-5 bg-slate/10 mb-2" />
              <div className="w-24 h-3 bg-slate/10" />
            </div>
          </div>
          <div className="w-3/4 h-8 bg-slate/10 mb-4" />
          <div className="space-y-3 mb-8">
            <div className="w-full h-4 bg-slate/10" />
            <div className="w-full h-4 bg-slate/10" />
            <div className="w-5/6 h-4 bg-slate/10" />
          </div>
        </Card>
      </PageContainer>
    );
  }
  if (!post) return (
    <PageContainer variant="detail" className="pb-12">
      <Alert variant="info">Publicação não encontrada.</Alert>
    </PageContainer>
  );

  const breadcrumbItems = [
    { label: 'Início', href: '/feed' },
    { label: 'Feed', href: '/feed' },
    { label: post.title || 'Post' }
  ];

  return (
    <PageContainer variant="detail" className="space-y-8 pb-12">
      <Breadcrumb items={breadcrumbItems} />

      <Link
        to="/feed"
        className="inline-flex items-center gap-2 text-base font-medium text-slate hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao feed
      </Link>

      {isEditing ? (
        <PostEditor
          editPost={post}
          onCancel={handleEditCancel}
          onEditComplete={handleEditComplete}
          onSubmit={async () => {}}
          onUpdate={async (postId, title, bodyHTML, category) => postService.updatePost(postId, { title, body: bodyHTML, category })}
          isPosting={false}
        />
      ) : (
        <Card variant="elevated" padding="lg">
          <div className="flex gap-4 mb-6">
            <div className="w-12 h-12 bg-ice flex items-center justify-center font-bold text-navy shrink-0 uppercase">
               {post.authorName ? post.authorName.charAt(0) : 'U'}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate flex items-center gap-2">
                  <Link to={`/perfil/${post.authorId}`} className="hover:text-sky transition-colors">{post.authorName || 'Usuário'}</Link>
                  <span className="text-sm font-normal text-slate/90">• {post.authorRole === 'MEMBRO_ATIVO' ? 'Membro Ativo' : post.authorRole === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Membro'}</span>
                </h3>
                <p className="text-sm uppercase text-slate/90 font-medium leading-relaxed">Postado em #{post.category}</p>
              </div>
              <div className="flex items-center gap-1">
                {canModify && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="min-h-[44px] min-w-[44px] text-slate hover:text-navy"
                      title="Editar publicação"
                      aria-label="Editar publicação"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="min-h-[44px] min-w-[44px] text-slate hover:text-danger"
                      title="Excluir publicação"
                      aria-label="Excluir publicação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {profile.id !== post.authorId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/mensagens', { state: { targetUserId: post.authorId, targetUserName: post.authorName } })}
                    title="Mandar Mensagem Direta"
                    className="text-sm font-semibold text-slate/90 hover:text-navy"
                  >
                    <MessageSquare className="w-4 h-4" /> MENSAGEM
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSaved}
                  className={`min-h-[44px] min-w-[44px] ${profile.savedPosts?.includes(post.id) ? 'text-sky' : 'text-slate/30 hover:text-navy'}`}
                  title="Salvar Post"
                >
                  <Bookmark className="w-5 h-5" fill={profile.savedPosts?.includes(post.id) ? 'currentColor' : 'none'} />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReport('POST', post.id, post.title + ' ' + post.body)}
              className="min-h-[44px] min-w-[44px] text-slate/40 hover:text-danger"
              title="Denunciar Publicação"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </div>

          <PageTitle as="h1" size="lg" className="mb-4">{post.title}</PageTitle>
          <div
            className="text-base leading-relaxed text-slate mb-8 prose prose-sm max-w-none prose-slate break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
          />

          <div className="flex gap-4 border-t border-border-gray pt-6">
            <ReactionButtons postId={post.id} reactions={post.reactions} currentUserId={profile.id} />
          </div>
        </Card>
      )}

      <div>
        <PageTitle as="h2" size="lg" className="mb-6">Comentários ({comments.length})</PageTitle>

        <Card variant="default" padding="md" className="mb-8">
          <form onSubmit={handleAddComment}>
            <label htmlFor="comment-body" className="sr-only">Seu comentário</label>
            <textarea
              id="comment-body"
              className="w-full min-h-[100px] border border-border-gray p-3 text-base text-slate focus:ring-2 focus:ring-navy focus:outline-none resize-y mb-4"
              placeholder="Adicione um comentário à discussão..."
              value={newCommentBody}
              onChange={e => setNewCommentBody(e.target.value)}
              required
            ></textarea>
            <div className="flex justify-end">
              <Button
                 type="submit"
                 disabled={isPosting}
                 isLoading={isPosting}
                 size="md"
              >
                {isPosting ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {comments.map(c => (
            <Card key={c.id} variant="default" padding="md">
               <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-ice flex items-center justify-center font-bold text-navy text-sm uppercase">
                     {c.authorName ? c.authorName.charAt(0) : 'U'}
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate leading-relaxed">{c.authorName}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => {
                       setNewCommentBody(prev => prev ? `${prev}\n@${c.authorName} ` : `@${c.authorName} `);
                       document.getElementById('comment-body')?.focus();
                     }}
                      className="text-sm font-bold text-slate/90 hover:text-navy min-h-[44px]"
                   >
                     <MessageSquare className="w-3 h-3" /> RESPONDER
                   </Button>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleReport('COMMENT', c.id, c.body)}
                     className="min-h-[44px] min-w-[44px] text-slate/30 hover:text-danger"
                     title="Denunciar Comentário"
                   >
                     <AlertTriangle className="w-3.5 h-3.5" />
                   </Button>
                 </div>
               </div>
               <p className="text-base text-slate whitespace-pre-wrap break-words leading-relaxed">{c.body}</p>
            </Card>
          ))}
          {comments.length === 0 && (
            <Card variant="outlined" padding="lg" className="flex flex-col items-center justify-center text-center text-slate border-dashed">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-navy" />
              <PageTitle as="h3" size="md" className="mb-2">Seja o primeiro a participar</PageTitle>
              <p className="text-base opacity-80 max-w-sm mx-auto leading-relaxed">Esta publicação ainda não possui comentários. Contribua com a discussão adicionando o seu!</p>
            </Card>
          )}
        </div>
      </div>
      <ReportDialog
        isOpen={reportTarget !== null}
        onCancel={() => setReportTarget(null)}
        onSubmitted={(reason, details) => submitReport(reason, details)}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Excluir publicação"
        message="Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </PageContainer>
  );
}