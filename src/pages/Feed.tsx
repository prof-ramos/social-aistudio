import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../types';
import { MessageSquare, Bookmark, PenLine, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostEditor } from '../components/feed/PostEditor';
import { PostCard } from '../components/feed/PostCard';
import { PostoHighlightCard } from '../components/feed/PostoHighlightCard';
import { AdminAlertCard } from '../components/feed/AdminAlertCard';
import { MemberSuggestionsCard } from '../components/feed/MemberSuggestionsCard';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/layout/PageContainer';
import { useFeed, FeedFilter } from '../hooks/useFeed';
import { useSavedPosts } from '../hooks/useSavedPosts';
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
    handleUpdatePost,
    handleDeletePost,
    handleEditPost,
    handleCloseEditor,
    editingPost,
    activeFilter,
    setActiveFilter,
    loadMore,
    hasMore
  } = useFeed(profile);

  const saved = useSavedPosts(profile.id, profile.savedPosts ?? []);
  const [postCount, setPostCount] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPostCount(null);
    postService.getPostCountByAuthor(profile.id)
      .then(setPostCount)
      .catch(() => setPostCount(null));
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

  return (
    <PageContainer variant="feed" className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border-gray pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Feed da Comunidade</h1>
        <Button
          onClick={() => setShowEditor(!showEditor)}
          variant="primary"
          size="md"
          className="tour-new-post shrink-0 uppercase tracking-wider text-sm font-bold"
        >
          NOVO POST
        </Button>
      </div>

      {/* Composer Prompt */}
      {!showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className="w-full bg-white border border-border-gray shadow-sm px-5 py-4 flex items-center gap-3 text-left hover:bg-ice/40 transition-colors group"
          aria-label="Criar novo post"
        >
          <div className="w-10 h-10 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy shrink-0 uppercase text-sm">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              profile.name.charAt(0)
            )}
          </div>
          <span className="text-slate/70 text-base group-hover:text-slate transition-colors">
            No que você está pensando, {profile.name.split(' ')[0]}?
          </span>
          <PenLine className="w-4 h-4 text-slate/40 ml-auto shrink-0 group-hover:text-sky transition-colors" strokeWidth={1.5} />
        </button>
      )}

      {showEditor && (
        <PostEditor
          onCancel={handleCloseEditor}
          onSubmit={handleCreatePost}
          onUpdate={handleUpdatePost}
          isPosting={isPosting}
          editPost={editingPost ?? undefined}
        />
      )}

      {/* Unified Toolbar */}
      <div className="bg-white border border-border-gray shadow-sm p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate/60" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Buscar no feed..."
              aria-label="Buscar no feed"
              className="w-full h-11 border border-border-gray pl-10 pr-3 text-base text-slate focus:ring-2 focus:ring-navy focus:outline-none placeholder:text-slate/50 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SlidersHorizontal className="h-4 w-4 text-slate/60" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <select
              className="w-full h-11 border border-border-gray bg-white pl-10 pr-3 text-base text-slate focus:ring-2 focus:ring-navy focus:outline-none appearance-none cursor-pointer"
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
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['RECENTES', 'MAIS_COMENTADOS', 'MEUS_POSTOS'] as FeedFilter[]).map(filterKey => (
             <button
               key={filterKey}
                onClick={() => setActiveFilter(filterKey)}
                aria-pressed={activeFilter === filterKey}
                className={`min-h-[44px] px-4 py-2 text-sm font-medium border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-navy ${activeFilter === filterKey ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border-gray hover:bg-ice/60'}`}
             >
               {filterKey === 'RECENTES' ? 'Recentes' : filterKey === 'MAIS_COMENTADOS' ? 'Mais comentados' : 'Meus postos'}
             </button>
          ))}
        </div>
      </div>

      {/* Main Content: Feed + Right Sidebar */}
      <div className="flex flex-col items-start gap-8 xl:flex-row">

        {/* Feed List — takes majority of width */}
        <div className="flex-1 min-w-0 w-full tour-feed-main space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate bg-white border border-dashed border-border-gray flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 mb-4 text-navy/40" />
              <p className="font-serif text-xl text-navy mb-2 leading-relaxed">Nenhum post encontrado</p>
              <p className="text-base text-slate max-w-sm mx-auto leading-relaxed">Não encontramos publicações para sua busca ou categoria selecionada.</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                profile={profile}
                isSaved={saved.isSaved(post.id)}
                onToggleSaved={saved.toggle}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
          )))}

          {hasMore && filteredPosts.length > 0 && (
            <div ref={observerTarget} className="py-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-navy border-t-transparent animate-spin"></div>
            </div>
          )}
          {!hasMore && filteredPosts.length > 0 && (
            <div className="text-center py-10 px-4 bg-white border border-dashed border-border-gray">
              <p className="text-navy font-serif text-lg mb-2 leading-relaxed">Você está em dia!</p>
              <p className="text-slate text-base mb-4 leading-relaxed">Seja o primeiro a postar algo novo para a comunidade.</p>
              <Button onClick={() => setShowEditor(true)} variant="secondary" size="sm" className="uppercase tracking-wider text-sm font-bold bg-ice hover:bg-ice/80">
                Criar Post
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar Area */}
        <div className="flex w-full flex-none flex-col gap-6 lg:sticky lg:top-16 xl:w-[280px]">
          {/* Quick Stats */}
          <div className="bg-white border border-border-gray shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy shrink-0 uppercase text-sm">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-navy text-sm truncate">{profile.name}</p>
                <p className="text-xs text-slate uppercase tracking-wider">{profile.role === 'MEMBRO_ATIVO' ? 'Membro Ativo' : profile.role === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador'}</p>
              </div>
            </div>
            <div className="flex gap-3 text-center">
              <div className="flex-1 bg-ice/50 py-2">
                <p className="font-serif text-lg text-navy leading-none">{postCount === null ? '--' : postCount}</p>
                <p className="text-[11px] uppercase font-bold text-slate tracking-wider mt-1">Posts</p>
              </div>
              <div className="flex-1 bg-ice/50 py-2">
                <p className="font-serif text-lg text-navy leading-none">{saved.savedCount}</p>
                <p className="text-[11px] uppercase font-bold text-slate tracking-wider mt-1">Salvos</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-gray/50 flex flex-col gap-1">
              <Link to={`/perfil/${profile.id}#posts`} className="text-sm font-medium text-slate hover:text-navy transition-colors flex items-center gap-2 py-1.5">
                <Bookmark className="w-3.5 h-3.5" strokeWidth={1.5} /> Minhas Publicações
              </Link>
              <Link to={`/perfil/${profile.id}#salvos`} className="text-sm font-medium text-slate hover:text-navy transition-colors flex items-center gap-2 py-1.5">
                <Bookmark className="w-3.5 h-3.5" strokeWidth={1.5} /> Itens Salvos
              </Link>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="bg-white border border-border-gray shadow-sm p-5">
            <h3 className="font-bold text-xs text-navy mb-3 uppercase tracking-wider">Tópicos em Alta</h3>
            <div className="flex flex-col gap-2">
              <Link to="/feed?q=reforma" className="text-sm font-medium text-slate hover:text-sky transition-colors">#reforma-previdenciaria</Link>
              <Link to="/feed?q=remocao" className="text-sm font-medium text-slate hover:text-sky transition-colors">#plano-remocao-2026</Link>
              <Link to="/feed?q=auxilio" className="text-sm font-medium text-slate hover:text-sky transition-colors">#auxilio-moradia</Link>
            </div>
          </div>

          <PostoHighlightCard />

          <MemberSuggestionsCard profile={profile} />

          {profile.role === 'ADMIN' && (
            <AdminAlertCard />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
