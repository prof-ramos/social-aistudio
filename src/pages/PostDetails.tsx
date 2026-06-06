import React, { useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { ArrowLeft, MessageSquare, ThumbsUp, AlertTriangle } from 'lucide-react';
import { usePostDetails } from '../hooks/usePostDetails';
import { ReactionButtons } from '../components/feed/ReactionButtons';

export default function PostDetails({ profile }: { profile: UserProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    post,
    comments,
    newCommentBody,
    setNewCommentBody,
    loading,
    isPosting,
    handleAddComment,
    handleReport
  } = usePostDetails(id, profile);

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

  if (loading) return <div className="p-12 text-center text-slate">Carregando publicação...</div>;
  if (!post) return <div className="p-12 text-center text-slate">Publicação não encontrada.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-slate hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="bg-white border border-border-gray p-8 shadow-sm">
        <div className="flex gap-4 mb-6">
          <div className="w-12 h-12 bg-ice flex items-center justify-center font-bold text-navy shrink-0 uppercase">
             {post.authorName ? post.authorName.charAt(0) : 'U'}
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate flex items-center gap-2">
                <Link to={`/perfil/${post.authorId}`} className="hover:text-sky transition-colors">{post.authorName || 'Usuário'}</Link>
                <span className="text-xs font-normal text-slate/60">• {post.authorRole === 'MEMBRO_ATIVO' ? 'Membro Ativo' : post.authorRole === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Membro'}</span>
              </h3>
              <p className="text-[10px] uppercase text-slate/50 font-medium">Postado em #{post.category}</p>
            </div>
            {profile.id !== post.authorId && (
              <button 
                onClick={() => navigate('/mensagens', { state: { targetUserId: post.authorId, targetUserName: post.authorName } })}
                className="text-xs font-semibold text-slate/50 hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none flex items-center gap-1.5 p-2"
                title="Mandar Mensagem Direta"
              >
                <MessageSquare className="w-4 h-4" /> MENSAGEM
              </button>
            )}
          </div>
          <button 
            onClick={() => handleReport('POST', post.id, post.title + ' ' + post.body)}
            className="text-slate/40 hover:text-red-500 transition-colors p-2"
            title="Denunciar Publicação"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-navy mb-4">{post.title}</h1>
        <div 
          className="text-base leading-relaxed text-slate mb-8 prose prose-sm max-w-none prose-slate"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <div className="flex gap-4 border-t border-border-gray pt-6">
          <ReactionButtons postId={post.id} reactions={post.reactions} currentUserId={profile.id} />
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl font-bold text-navy mb-6">Comentários ({comments.length})</h2>
        
        <form onSubmit={handleAddComment} className="bg-white border border-border-gray shadow-sm p-6 mb-8">
          <label htmlFor="comment-body" className="sr-only">Seu comentário</label>
          <textarea
            id="comment-body"
            className="w-full min-h-[100px] border border-border-gray p-3 text-sm text-slate focus:ring-1 focus:ring-navy focus:outline-none resize-y mb-4"
            placeholder="Adicione um comentário à discussão..."
            value={newCommentBody}
            onChange={e => setNewCommentBody(e.target.value)}
            required
          ></textarea>
          <div className="flex justify-end">
            <button 
               type="submit" 
               disabled={isPosting}
               className="px-6 py-2.5 min-h-[44px] bg-navy text-white text-sm font-medium hover:bg-navy-dark transition-colors focus:ring-2 focus:ring-navy focus:outline-none disabled:opacity-50"
            >
              {isPosting ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-white border border-border-gray p-6">
               <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-ice flex items-center justify-center font-bold text-navy text-xs uppercase">
                     {c.authorName ? c.authorName.charAt(0) : 'U'}
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate">{c.authorName}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <button 
                     onClick={() => {
                       setNewCommentBody(prev => prev ? `${prev}\n@${c.authorName} ` : `@${c.authorName} `);
                       document.getElementById('comment-body')?.focus();
                     }}
                     className="text-[10px] font-bold text-slate/50 hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none flex items-center gap-1 min-h-[44px]"
                   >
                     <MessageSquare className="w-3 h-3" /> RESPONDER
                   </button>
                   <button 
                     onClick={() => handleReport('COMMENT', c.id, c.body)}
                     className="text-slate/30 hover:text-red-500 transition-colors p-1"
                     title="Denunciar Comentário"
                   >
                     <AlertTriangle className="w-3.5 h-3.5" />
                   </button>
                 </div>
               </div>
               <p className="text-sm text-slate whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate bg-white border border-dashed border-border-gray">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-navy" />
              <p className="font-serif text-xl text-navy mb-2">Seja o primeiro a participar</p>
              <p className="text-sm opacity-80 max-w-sm mx-auto">Esta publicação ainda não possui comentários. Contribua com a discussão adicionando o seu!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
