import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../types';
import { Pin, ThumbsUp, MessageSquare, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEditor } from '../components/feed/PostEditor';
import { PostCard } from '../components/feed/PostCard';
import { PostoHighlightCard } from '../components/feed/PostoHighlightCard';
import { AdminAlertCard } from '../components/feed/AdminAlertCard';
import { LeftSidebar } from '../components/feed/LeftSidebar';
import { MemberSuggestionsCard } from '../components/feed/MemberSuggestionsCard';
import { Button } from '../components/ui/Button';
import { PageTitle } from '../components/ui/PageTitle';
import { PageContainer } from '../components/layout/PageContainer';
import { useFeed, FeedFilter } from '../hooks/useFeed';
import { userService } from '../services/userService';
import { postService } from '../services/postService';

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
    handleCreatePost,
    activeFilter,
    setActiveFilter,
    loadMore,
    hasMore
  } = useFeed(profile);

  const [postCount, setPostCount] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    postService.getPostCountByAuthor(profile.id).then(setPostCount);
  }, [profile.id]);

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      if (e.key === 'n' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowEditor(true);
      }
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadMore]);

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
    <PageContainer variant="feed" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-gray pb-4 mb-2">
        <PageTitle className="text-2xl sm:text-4xl">Feed da Comunidade</PageTitle>
        <Button
          onClick={() => setShowEditor(!showEditor)}
          variant="primary"
          size="md"
          className="tour-new-post shrink-0 uppercase tracking-wider text-sm font-bold"
        >
          NOVO POST
        </Button>
      </div>

        {showEditor && (
          <PostEditor
            onCancel={() => setShowEditor(false)}
            onSubmit={handleCreatePost}
            onUpdate={undefined}
            isPosting={isPosting}
          />
        )}

      <div className="bg-ice border border-border-gray p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          <input 
            type="text" 
            placeholder="Buscar no feed..."
            aria-label="Buscar no feed"
            className="flex-1 h-11 border border-border-gray px-3 text-base text-slate focus:ring-2 focus:ring-navy focus:outline-none placeholder:text-slate/60"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="h-11 border border-border-gray bg-white px-3 text-base text-slate focus:ring-2 focus:ring-navy focus:outline-none min-w-[180px]"
            aria-label="Filtrar por categoria"
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

        <div className="flex gap-2 flex-wrap">
          {(['RECENTES', 'MAIS_COMENTADOS', 'MEUS_POSTOS'] as FeedFilter[]).map(filterKey => (
             <button 
               key={filterKey}
               onClick={() => setActiveFilter(filterKey)}
               className={`min-h-[44px] px-4 py-2 text-sm font-bold uppercase tracking-wider border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-navy ${activeFilter === filterKey ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border-gray hover:bg-slate/5'}`}
             >
               {filterKey === 'RECENTES' ? 'Recentes' : filterKey === 'MAIS_COMENTADOS' ? 'Mais comentados' : 'Meus postos'}
             </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start gap-8 xl:flex-row">
        
        {/* Left Sidebar Arena */}
        <div className="hidden xl:block">
          <LeftSidebar profile={profile} postCount={postCount} />
        </div>

        {/* Feed List */}
        <div className="flex-1 space-y-8 min-w-0 tour-feed-main">
          {filteredPosts.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate bg-white border border-dashed border-border-gray flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20 text-navy" />
              <p className="font-serif text-xl text-navy mb-2 leading-relaxed">Nenhum post encontrado</p>
              <p className="text-base opacity-80 max-w-sm mx-auto leading-relaxed">Não encontramos publicações para sua busca ou categoria selecionada.</p>
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
          
          {hasMore && filteredPosts.length > 0 && (
            <div ref={observerTarget} className="py-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-navy border-t-transparent animate-spin"></div>
            </div>
          )}
          {!hasMore && filteredPosts.length > 0 && (
            <div className="text-center py-10 px-4 bg-ice border border-dashed border-border-gray">
              <p className="text-navy font-serif text-lg mb-2 leading-relaxed">Você está em dia!</p>
              <p className="text-slate text-base mb-4 leading-relaxed">Seja o primeiro a postar algo novo para a comunidade.</p>
              <Button onClick={() => setShowEditor(true)} variant="secondary" size="sm" className="uppercase tracking-wider text-sm font-bold bg-white">
                Criar Post
              </Button>
            </div>
          )}
        </div>
        
        {/* Right Sidebar Area */}
        <div className="flex w-full flex-none flex-col gap-8 lg:sticky lg:top-16 xl:w-[300px]">
          {/* Posto Highlight Card */}
          <PostoHighlightCard profile={profile} />

          <MemberSuggestionsCard profile={profile} />

          {profile.role === 'ADMIN' && (
            <AdminAlertCard />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
