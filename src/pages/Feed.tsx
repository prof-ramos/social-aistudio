import React from 'react';
import { UserProfile } from '../types';
import { Pin, ThumbsUp, MessageSquare, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEditor } from '../components/feed/PostEditor';
import { PostCard } from '../components/feed/PostCard';
import { PostoHighlightCard } from '../components/feed/PostoHighlightCard';
import { AdminAlertCard } from '../components/feed/AdminAlertCard';
import { LeftSidebar } from '../components/feed/LeftSidebar';
import { useFeed } from '../hooks/useFeed';
import { userService } from '../services/userService';

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

  const toggleSaved = async (postId: string) => {
    try {
      await userService.toggleSavedPost(profile.id, postId);
      if (!profile.savedPosts) profile.savedPosts = [];
      if (profile.savedPosts.includes(postId)) {
        profile.savedPosts = profile.savedPosts.filter(id => id !== postId);
      } else {
        profile.savedPosts.push(postId);
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <h1 className="text-4xl text-navy font-serif">Feed da Comunidade</h1>
        <button onClick={() => setShowEditor(!showEditor)} className="bg-navy text-white px-6 py-3 font-medium cursor-pointer transition-colors hover:bg-slate">
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

      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* Left Sidebar Arena */}
        <div className="hidden lg:block">
          <LeftSidebar profile={profile} />
        </div>

        {/* Feed List */}
        <div className="flex-1 space-y-8 min-w-0">
          {filteredPosts.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate bg-white border border-dashed border-border-gray flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-navy" />
              <p className="font-serif text-xl text-navy mb-2">Nenhum post encontrado</p>
              <p className="text-sm opacity-80 max-w-sm mx-auto">Não encontramos publicações para sua busca ou categoria selecionada.</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                profile={profile} 
                onToggleSaved={toggleSaved} 
              />
          )))}
        </div>
        
        {/* Right Sidebar Area */}
        <div className="w-full lg:w-[280px] xl:w-[300px] flex-none flex flex-col gap-8 sticky top-24">
          {/* Posto Highlight Card */}
          <PostoHighlightCard />

          {profile.role === 'ADMIN' && (
            <AdminAlertCard />
          )}
        </div>
      </div>
    </div>
  );
}
