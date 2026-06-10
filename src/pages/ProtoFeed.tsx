import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Post, UserProfile } from '../types';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Clock,
  ArrowRight,
  Pin,
  Eye,
  ThumbsUp,
  Flame,
  Hash,
  Filter,
  ChevronRight,
  Search,
  PenLine,
} from 'lucide-react';

// ────────────────────────────────────────────────
// PROTÓTIPO — DESCARTÁVEL
// Pergunta: "Como o feed do Social-ASOF deveria se parecer?"
// Alterne entre variações pela URL: ?variant=classic|editorial|dense|shadcn
// ────────────────────────────────────────────────

const PROFILE_MOCK: UserProfile = {
  id: 'mock-user',
  name: 'Gabriel Ramos',
  email: 'gabriel@example.org',
  role: 'MEMBRO_ATIVO',
  avatarUrl: '',
  savedPosts: [],
  isOnline: true,
};

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Reforma da Previdência: o que muda para membros do exterior em 2026',
    body: '<p>O texto aprovado no Congresso Nacional traz mudanças significativas para os servidores que atuam em postos diplomáticos. Entre os principais pontos, destacam-se as novas regras de tempo de contribuição e o cálculo atualizado dos benefícios.</p><p>É fundamental que cada um avalie como essas alterações impactam o planejamento de carreira.</p>',
    category: 'APOSENTADORIA',
    authorName: 'Ana Paula Ferreira',
    authorRole: 'MEMBRO_ATIVO',
    authorId: 'a1',
    pinned: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reactions: { like: ['u1', 'u2', 'u3', 'u4'], fire: ['u5', 'u6'] },
    commentCount: 23,
  },
  {
    id: '2',
    title: 'Plano de Remoção 2026 — expectativas e preparação',
    body: '<p>Com o edital previsto para o segundo semestre, muitos colegas já começaram a se preparar. Compartilhem experiências de remoções anteriores e dicas de estudo.</p>',
    category: 'CARREIRA',
    authorName: 'Roberto Costa',
    authorRole: 'MEMBRO_ATIVO',
    authorId: 'a2',
    pinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    reactions: { like: ['u1', 'u2'], heart: ['u3'] },
    commentCount: 14,
  },
  {
    id: '3',
    title: 'Auxílio-moradia em Paris: atualização dos valores',
    body: '<p>A tabela do auxílio foi reajustada considerando a variação do custo de vida na capital francesa. Veja os novos valores e como solicitar a revisão.</p>',
    category: 'VIDA_EXTERIOR',
    authorName: 'Mariana Duarte',
    authorRole: 'MEMBRO_ATIVO',
    authorId: 'a3',
    pinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    reactions: { like: ['u1'] },
    commentCount: 8,
  },
  {
    id: '4',
    title: 'Novo consulado em Dubai — primeiras impressões',
    body: '<p>A inauguração do novo posto trouxe infraestrutura moderna e processos digitalizados. Compartilho aqui um panorama dos primeiros meses de operação.</p>',
    category: 'POSTOS',
    authorName: 'Lucas Mendonça',
    authorRole: 'MEMBRO_ATIVO',
    authorId: 'a4',
    pinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    reactions: { like: ['u1', 'u2', 'u3', 'u4', 'u5'], fire: ['u6', 'u7'] },
    commentCount: 31,
  },
  {
    id: '5',
    title: 'Dúvidas frequentes sobre o regime de previdência complementar',
    body: '<p>Reuni as perguntas mais comuns enviadas ao setor de RH e as respostas oficiais para facilitar a consulta coletiva.</p>',
    category: 'GERAL',
    authorName: 'Fernanda Lopes',
    authorRole: 'MEMBRO_APOSENTADO',
    authorId: 'a5',
    pinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reactions: {},
    commentCount: 5,
  },
  {
    id: '6',
    title: 'Experiência de trabalho remoto durante missão no exterior',
    body: '<p>Durante a pandemia, muitos postos adaptaram o regime de trabalho. Quais práticas permanecem e quais retornaram ao presencial?</p>',
    category: 'VIDA_EXTERIOR',
    authorName: 'Carlos Eduardo',
    authorRole: 'MEMBRO_ATIVO',
    authorId: 'a6',
    pinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    reactions: { like: ['u1'], heart: ['u2', 'u3'] },
    commentCount: 12,
  },
];

function categoryLabel(cat: string) {
  switch (cat) {
    case 'POSTOS': return 'Postos';
    case 'CARREIRA': return 'Carreira';
    case 'VIDA_EXTERIOR': return 'Vida no Exterior';
    case 'APOSENTADORIA': return 'Aposentadoria';
    default: return 'Geral';
  }
}

function categoryColor(cat: string) {
  switch (cat) {
    case 'POSTOS': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CARREIRA': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'VIDA_EXTERIOR': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'APOSENTADORIA': return 'bg-violet-50 text-violet-700 border-violet-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('');
}

const ROLE_LABELS: Record<string, string> = {
  MEMBRO_ATIVO: 'Membro Ativo',
  MEMBRO_APOSENTADO: 'Membro Aposentado',
  ADMIN: 'Administrador',
  PENDENTE: 'Pendente',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// ═══════════════════════════════════════════════
// Variant Switch Bar
// ═══════════════════════════════════════════════
function VariantSwitcher() {
  const [params, setParams] = useSearchParams();
  const current = params.get('variant') || 'classic';
  const variants = [
    { key: 'classic', label: 'Clássico Aprimorado' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'dense', label: 'Compacto' },
    { key: 'shadcn', label: 'shadcn/ui' },
  ] as const;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-navy text-white rounded-full shadow-xl px-4 py-2 flex items-center gap-2 font-sans">
      <span className="text-xs font-bold uppercase tracking-wider mr-2 opacity-80">Variante</span>
      {variants.map(v => (
        <button
          key={v.key}
          onClick={() => { params.set('variant', v.key); setParams(params); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            current === v.key
              ? 'bg-white text-navy'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Variante A — Clássico Aprimorado
// ═══════════════════════════════════════════════
function ClassicPost({ post, index }: { post: Post; index: number }) {
  return (
    <article
      className={`bg-white border border-border-gray shadow-sm p-6 transition-colors font-sans ${
        post.pinned ? 'border-l-4 border-l-sky bg-sky/[0.03]' : ''
      } ${index === 0 ? 'mt-0' : ''}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy shrink-0 text-sm">
          {initials(post.authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-navy text-base">{post.authorName}</span>
              <span className="text-sm text-slate/60">• {ROLE_LABELS[post.authorRole] || 'Membro'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate/60">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-sm font-semibold uppercase tracking-wide ${categoryColor(post.category)}`}>
              {categoryLabel(post.category)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        {post.pinned && (
          <span className="flex items-center gap-1 text-xs font-bold text-sky uppercase tracking-wider">
            <Pin className="w-3 h-3" /> Fixado
          </span>
        )}
      </div>

      <h3 className="font-bold text-navy text-lg mb-2 leading-snug">{post.title}</h3>
      <p className="text-slate/80 text-base leading-relaxed line-clamp-3 mb-5">
        {post.body.replace(/<[^>]+>/g, '')}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border-gray/50">
        <div className="flex items-center gap-5 text-sm text-slate">
          <button className="flex items-center gap-1.5 hover:text-sky transition-colors">
            <ThumbsUp className="w-4 h-4" />
            {Object.values(post.reactions || {}).flat().length}
          </button>
          <button className="flex items-center gap-1.5 hover:text-sky transition-colors">
            <MessageSquare className="w-4 h-4" />
            {post.commentCount || 0}
          </button>
          <button className="flex items-center gap-1.5 hover:text-sky transition-colors">
            <Eye className="w-4 h-4" />
            {120 + index * 34}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate hover:text-navy hover:bg-ice rounded transition-colors" aria-label="Salvar">
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate hover:text-navy hover:bg-ice rounded transition-colors" aria-label="Compartilhar">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ClassicFeed() {
  const [activeFilter, setActiveFilter] = useState<'todos' | 'popular' | 'meus'>('todos');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...MOCK_POSTS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
    }
    if (activeFilter === 'popular') {
      list.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    }
    return list;
  }, [search, activeFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-gray pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Feed da Comunidade</h1>
        <button className="bg-navy text-white px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-navy-dark transition-colors">
          Novo Post
        </button>
      </div>

      {/* Composer */}
      <button className="w-full bg-white border border-border-gray shadow-sm px-5 py-4 flex items-center gap-3 text-left hover:bg-ice/40 transition-colors group">
        <div className="w-10 h-10 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy shrink-0 text-sm">
          {initials(PROFILE_MOCK.name)}
        </div>
        <span className="text-slate/70 group-hover:text-slate transition-colors">No que você está pensando, Gabriel?</span>
        <PenLine className="w-4 h-4 text-slate/40 ml-auto group-hover:text-sky transition-colors" />
      </button>

      {/* Toolbar */}
      <div className="bg-white border border-border-gray shadow-sm p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate/60 my-auto" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Buscar no feed..."
            className="w-full h-11 border border-border-gray pl-10 pr-3 text-base text-slate focus:ring-2 focus:ring-navy focus:outline-none placeholder:text-slate/50 bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'todos', label: 'Recentes' },
            { key: 'popular', label: 'Mais comentados' },
            { key: 'meus', label: 'Meus postos' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`min-h-[44px] px-4 py-2 text-sm font-medium border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-navy ${
                activeFilter === f.key ? 'bg-navy text-white border-navy' : 'bg-white text-slate border-border-gray hover:bg-ice/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col items-start gap-8 xl:flex-row">
        <div className="flex-1 min-w-0 w-full space-y-5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate bg-white border border-dashed border-border-gray">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-navy/40" />
              <p className="font-serif text-xl text-navy mb-2">Nenhum post encontrado</p>
              <p className="text-base text-slate max-w-sm mx-auto">Não encontramos publicações para sua busca.</p>
            </div>
          ) : (
            filtered.map((post, i) => <ClassicPost key={post.id} post={post} index={i} />)
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="flex w-full flex-none flex-col gap-6 lg:sticky lg:top-16 xl:w-[280px]">
          <div className="bg-white border border-border-gray shadow-sm p-5">
            <h3 className="font-bold text-xs text-navy mb-3 uppercase tracking-wider">Tópicos em Alta</h3>
            <div className="flex flex-col gap-2">
              {['#reforma-previdenciaria', '#plano-remocao-2026', '#auxilio-moradia'].map(tag => (
                <span key={tag} className="text-sm font-medium text-slate hover:text-sky transition-colors cursor-pointer">{tag}</span>
              ))}
            </div>
          </div>
          <div className="bg-white border border-border-gray shadow-sm p-5">
            <h3 className="font-bold text-xs text-navy mb-3 uppercase tracking-wider">Destaque</h3>
            <p className="text-sm text-slate leading-relaxed">Confira as novas diretrizes para o Plano de Remoção 2026 publicadas no DOU.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Variante B — Editorial
// ═══════════════════════════════════════════════
function EditorialHero({ post }: { post: Post }) {
  return (
    <article className="relative bg-navy text-white p-8 sm:p-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, white 14%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, white 14%, transparent) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4 text-white/70 text-xs font-semibold uppercase tracking-widest">
          <span className="bg-white/15 px-2 py-1">{categoryLabel(post.category)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(post.createdAt)}</span>
          {post.pinned && <span className="flex items-center gap-1"><Pin className="w-3 h-3" /> Fixado</span>}
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl font-bold leading-tight mb-4 max-w-2xl">
          {post.title}
        </h2>
        <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl mb-6 line-clamp-3">
          {post.body.replace(/<[^>]+>/g, '')}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold text-sm">
            {initials(post.authorName)}
          </div>
          <div>
            <p className="font-bold text-sm">{post.authorName}</p>
            <p className="text-xs text-white/60">{ROLE_LABELS[post.authorRole] || 'Membro'}</p>
          </div>
          <button className="ml-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 text-sm font-medium">
            Ler artigo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EditorialPost({ post, isSecondary }: { post: Post; isSecondary?: boolean }) {
  if (isSecondary) {
    return (
      <article className="group flex flex-col gap-3 py-6 border-b border-border-gray last:border-b-0">
        <div className="flex items-center gap-2 text-xs text-slate/60 uppercase tracking-wider font-semibold">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border ${categoryColor(post.category)}`}>{categoryLabel(post.category)}</span>
          <span>•</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        <h3 className="font-serif text-xl font-bold text-navy group-hover:text-sky transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-slate/70 text-sm leading-relaxed line-clamp-2">
          {post.body.replace(/<[^>]+>/g, '')}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate/60 mt-1">
          <span className="font-bold text-slate">{post.authorName}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.commentCount}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white border border-border-gray p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3 text-sm text-slate/60 uppercase tracking-wider font-semibold">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border ${categoryColor(post.category)}`}>{categoryLabel(post.category)}</span>
        {post.pinned && <span className="text-sky font-bold flex items-center gap-1"><Pin className="w-3 h-3" /> Fixado</span>}
      </div>
      <h3 className="font-serif text-2xl font-bold text-navy group-hover:text-sky transition-colors leading-snug mb-3">
        {post.title}
      </h3>
      <p className="text-slate/80 text-base leading-relaxed line-clamp-3 mb-5">
        {post.body.replace(/<[^>]+>/g, '')}
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-border-gray/40">
        <div className="w-8 h-8 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy text-xs">
          {initials(post.authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-navy truncate">{post.authorName}</p>
          <p className="text-xs text-slate/60">{ROLE_LABELS[post.authorRole] || 'Membro'}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate">
          <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {Object.values(post.reactions || {}).flat().length}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {post.commentCount}</span>
        </div>
      </div>
    </article>
  );
}

function EditorialFeed() {
  const heroPost = MOCK_POSTS[0];
  const rest = MOCK_POSTS.slice(1);
  const secondary = rest.slice(0, 2);
  const remaining = rest.slice(2);

  return (
    <div className="flex flex-col gap-8">
      {/* Masthead */}
      <div className="border-b-2 border-navy pb-4 flex items-end justify-between">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-navy tracking-tight">Feed</h1>
        <p className="hidden sm:block text-slate text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Hero */}
      <EditorialHero post={heroPost} />

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border-gray pb-2">
            <h2 className="font-serif text-xl font-bold text-navy">Mais recentes</h2>
            <button className="flex items-center gap-1 text-sm text-sky font-medium hover:underline">
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {remaining.map(post => (
            <EditorialPost key={post.id} post={post} />
          ))}
        </div>

        {/* Side column */}
        <aside className="flex flex-col gap-6">
          <div className="bg-ice/50 border border-border-gray p-5">
            <h3 className="font-bold text-xs text-navy mb-4 uppercase tracking-wider">Em discussão</h3>
            <div className="flex flex-col gap-4">
              {secondary.map(post => (
                <EditorialPost key={post.id} post={post} isSecondary />
              ))}
            </div>
          </div>

          <div className="bg-white border border-border-gray shadow-sm p-5">
            <h3 className="font-bold text-xs text-navy mb-3 uppercase tracking-wider">Tags populares</h3>
            <div className="flex flex-wrap gap-2">
              {['Aposentadoria', 'Remoção', 'Auxílio', 'Postos', 'Carreira'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-ice text-navy text-sm font-medium border border-border-gray hover:bg-sky/10 hover:border-sky/30 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Variante C — Compacto / Denso
// ═══════════════════════════════════════════════
function DensePost({ post }: { post: Post }) {
  return (
    <article className="py-4 border-b border-border-gray/60 last:border-b-0 hover:bg-ice/30 transition-colors px-2 -mx-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy text-sm shrink-0">
          {initials(post.authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-bold text-navy text-sm">{post.authorName}</span>
            <span className="text-sm text-slate/50">@{post.authorId}</span>
            <span className="text-sm text-slate/40">• {timeAgo(post.createdAt)}</span>
            {post.pinned && <Pin className="w-3 h-3 text-sky ml-auto" />}
          </div>

          <h3 className="font-bold text-navy text-[15px] leading-snug mb-1">{post.title}</h3>
          <p className="text-slate/70 text-sm leading-relaxed line-clamp-2 mb-2">
            {post.body.replace(/<[^>]+>/g, '')}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate/70">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-sm font-semibold uppercase tracking-wide ${categoryColor(post.category)}`}>
              {categoryLabel(post.category)}
            </span>
            <button className="flex items-center gap-1 hover:text-sky transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
              {Object.values(post.reactions || {}).flat().length}
            </button>
            <button className="flex items-center gap-1 hover:text-sky transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.commentCount || 0}
            </button>
            <button className="flex items-center gap-1 hover:text-sky transition-colors">
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1 hover:text-sky transition-colors ml-auto">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function DenseFeed() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = ['Todos', 'Postos', 'Carreira', 'Vida no Exterior', 'Aposentadoria'];

  const filtered = useMemo(() => {
    if (!activeTag || activeTag === 'Todos') return MOCK_POSTS;
    return MOCK_POSTS.filter(p => categoryLabel(p.category) === activeTag);
  }, [activeTag]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header inline */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold text-navy">Feed</h1>
        <button className="bg-navy text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-navy-dark transition-colors">
          + Novo
        </button>
      </div>

      {/* Tag pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeTag === tag || (!activeTag && tag === 'Todos')
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-slate border-border-gray hover:bg-ice'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Quick composer */}
      <div className="flex items-center gap-3 border border-border-gray bg-white px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy text-sm shrink-0">
          {initials(PROFILE_MOCK.name)}
        </div>
        <input
          type="text"
          placeholder="No que você está pensando?"
          className="flex-1 bg-transparent text-sm text-slate outline-none placeholder:text-slate/50"
        />
        <PenLine className="w-4 h-4 text-slate/40" />
      </div>

      {/* Stream */}
      <div>
        {filtered.map(post => (
          <DensePost key={post.id} post={post} />
        ))}
      </div>

      {/* Inline suggested */}
      <div className="bg-ice/40 border border-border-gray p-4">
        <h3 className="font-bold text-xs text-navy mb-2 uppercase tracking-wider">Talvez você goste</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Hash className="w-4 h-4 text-sky shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-navy">#plano-remocao-2026</p>
              <p className="text-xs text-slate">142 posts esta semana</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-navy">Nova portaria sobre teletrabalho no exterior</p>
              <p className="text-xs text-slate">Publicado há 3h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Variante D — shadcn/ui Style
// ═══════════════════════════════════════════════
function ShadcnPost({ post }: { post: Post }) {
  return (
    <article className={`bg-white rounded-xl border border-border-gray/60 shadow-sm p-5 transition-all hover:shadow-md hover:border-border-gray ${post.pinned ? 'ring-1 ring-sky/30' : ''}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy text-sm shrink-0">
          {initials(post.authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-navy text-sm">{post.authorName}</span>
            <span className="text-xs text-slate/50">{ROLE_LABELS[post.authorRole] || 'Membro'}</span>
            <span className="text-xs text-slate/30">•</span>
            <span className="text-xs text-slate/50">{timeAgo(post.createdAt)}</span>
            {post.pinned && <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-sky uppercase tracking-wider bg-sky/10 px-2 py-0.5 rounded-full"><Pin className="w-3 h-3" /> Fixado</span>}
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-navy text-base leading-snug mb-2">
        {post.title}
      </h3>
      <p className="text-slate/70 text-sm leading-relaxed line-clamp-3 mb-4">
        {post.body.replace(/<[^>]+>/g, '')}
      </p>

      <div className="h-px bg-border-gray/40 mb-4" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${categoryColor(post.category)}`}>
            {categoryLabel(post.category)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate hover:bg-ice transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            {Object.values(post.reactions || {}).flat().length}
          </button>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate hover:bg-ice transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            {post.commentCount || 0}
          </button>
          <button className="inline-flex items-center p-1.5 rounded-md text-slate hover:bg-ice transition-colors" aria-label="Salvar">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button className="inline-flex items-center p-1.5 rounded-md text-slate hover:bg-ice transition-colors" aria-label="Compartilhar">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ShadcnFeed() {
  const [activeTab, setActiveTab] = useState<'todos' | 'popular'>('todos');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...MOCK_POSTS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
    }
    if (activeTab === 'popular') {
      list.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    }
    return list;
  }, [search, activeTab]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl text-navy tracking-tight">Feed</h1>
        <button className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-navy-dark transition-colors shadow-sm">
          <PenLine className="w-4 h-4" /> Novo Post
        </button>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-xl border border-border-gray/60 shadow-sm p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-ice border border-border-gray flex items-center justify-center font-bold text-navy text-xs shrink-0">
          {initials(PROFILE_MOCK.name)}
        </div>
        <input
          type="text"
          placeholder="No que você está pensando, Gabriel?"
          className="flex-1 bg-transparent text-sm text-slate outline-none placeholder:text-slate/40"
        />
        <PenLine className="w-4 h-4 text-slate/30" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-border-gray/60 shadow-sm p-1 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 px-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/40" />
          <input
            type="text"
            placeholder="Buscar no feed..."
            className="w-full h-9 pl-9 pr-3 text-sm text-slate bg-ice/40 rounded-md border border-transparent focus:border-border-gray focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky/20 transition-all placeholder:text-slate/40"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 px-1">
          {([
            { key: 'todos', label: 'Recentes' },
            { key: 'popular', label: 'Mais comentados' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-slate hover:bg-ice'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {filtered.map(post => (
          <ShadcnPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Entry
// ═══════════════════════════════════════════════
export default function ProtoFeed() {
  const [params] = useSearchParams();
  const variant = params.get('variant') || 'classic';

  return (
    <PageContainer variant="feed" className="pb-24">
      {variant === 'editorial' && <EditorialFeed />}
      {variant === 'dense' && <DenseFeed />}
      {variant === 'shadcn' && <ShadcnFeed />}
      {(variant === 'classic' || !['editorial', 'dense', 'shadcn'].includes(variant)) && <ClassicFeed />}
      <VariantSwitcher />
    </PageContainer>
  );
}
