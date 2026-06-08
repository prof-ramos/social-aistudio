import React from 'react';
import { Post, UserProfile } from '../../types';
import { Pin, MessageSquare, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactionButtons } from './ReactionButtons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PostCardProps {
  post: Post;
  profile: UserProfile;
  onToggleSaved: (postId: string) => void;
}

function PostCardComponent({ post, profile, onToggleSaved }: PostCardProps) {
  const isSaved = profile.savedPosts?.includes(post.id);

  return (
    <Card variant="default" padding="md" className={`relative transition-colors font-sans ${post.pinned ? 'border-sky shadow-sm bg-sky/5' : ''}`}>
       {post.pinned && (
       <div className="absolute top-0 right-0 bg-sky text-navy px-3 py-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
         <Pin className="w-3 h-3" strokeWidth={1.5} /> Fixado
       </div>
     )}
     <div className="flex gap-4 mb-4">
       <div className="w-12 h-12 bg-ice flex items-center justify-center font-bold text-navy shrink-0 uppercase">
          {post.authorName ? post.authorName.charAt(0) : 'U'}
       </div>
       <div className="flex-1 flex justify-between items-start">
         <div>
           <h3 className="font-bold text-lg text-slate">
             {post.authorName || 'Usuário'} <span className="text-xs font-normal text-slate/60">• {post.authorRole === 'MEMBRO_ATIVO' ? 'Membro Ativo' : post.authorRole === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador'}</span>
           </h3>
           <div className="flex items-center">
             <p className="text-[10px] uppercase text-slate/70 font-bold tracking-wider mt-0.5">#{post.category}</p>
           </div>
         </div>
         <Button
           variant="ghost"
           size="sm"
           onClick={() => onToggleSaved(post.id)}
           className={`min-h-[44px] min-w-[44px] ${isSaved ? 'text-sky bg-sky/10' : 'text-slate/30 hover:text-navy hover:bg-ice'}`}
           aria-label={isSaved ? 'Remover dos salvos' : 'Salvar post'}
         >
           <Bookmark className="w-5 h-5" strokeWidth={isSaved ? 2 : 1.5} fill={isSaved ? 'currentColor' : 'none'} />
         </Button>
       </div>
     </div>
     <Link to={`/feed/${post.id}`}>
       <h4 className="font-bold text-navy text-xl mb-3 hover:text-sky transition-colors">{post.title}</h4>
     </Link>
     <div
       className="text-sm leading-relaxed mb-6 text-slate line-clamp-3 prose prose-slate prose-sm"
       dangerouslySetInnerHTML={{ __html: post.body }}
     />

     <div className="flex gap-4 border-t border-border-gray/50 pt-4">
       <ReactionButtons postId={post.id} reactions={post.reactions} currentUserId={profile.id} />
       <Link to={`/feed/${post.id}#comment`} className="text-xs font-bold text-slate/70 flex items-center gap-2 hover:text-navy transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px]">
         <MessageSquare className="w-4 h-4" strokeWidth={1.5} /> RESPONDER
       </Link>
     </div>
  </Card>
  );
}

export const PostCard = React.memo(PostCardComponent);
