# Plano de Migração: Firebase → Supabase

## 1. Visão Geral

| Aspecto | Firebase (Hoje) | Supabase (Proposta) |
|---|---|---|
| **Banco** | Firestore (NoSQL, documentos) | PostgreSQL (SQL relacional) |
| **Auth** | Firebase Auth (email/senha) | Supabase Auth (email/senha, JWT) |
| **Realtime** | `onSnapshot` do Firestore | Supabase Realtime (LISTEN/NOTIFY via WebSocket) |
| **Storage** | — | Supabase Storage (avatares, anexos) |
| **Backend** | 1 rota Express (SMTP) | Edge Functions / API routes no Express |
| **Preço** | Spark (free) | Free tier ($0) — dá conta por 3–5 anos |

### Por que migrar?

- **Custo previsível**: free tier do Supabase cobre ~150 usuários diplomáticos por anos
- **Modelo relacional**: PostgreSQL elimina os hacks de NoSQL (subcoleções, arrays aninhados, `increment` manual)
- **Portabilidade**: dados em SQL são mais fáceis de exportar/backup/migrar no futuro
- **Consultas complexas**: JOINs, CTEs, triggers — resolveriam o "buscar todos usuários para menções" que hoje traz `limit(50)` e filtra no cliente
- **Familiaridade**: devs fullstack conhecem SQL; Firestore é um modelo proprietário

---

## 2. Schema PostgreSQL

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBRO_ATIVO', 'MEMBRO_APOSENTADO', 'PENDENTE');
CREATE TYPE post_category AS ENUM ('POSTOS', 'CARREIRA', 'VIDA_EXTERIOR', 'APOSENTADORIA', 'GERAL');
CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED_KEPT', 'RESOLVED_WARNED', 'RESOLVED_REMOVED');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Usuários (sincronizado com Supabase Auth via trigger)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'PENDENTE',
  avatar_url TEXT,
  bio TEXT,
  current_post TEXT,
  interests TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_online TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category post_category NOT NULL DEFAULT 'GERAL',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned BOOLEAN DEFAULT FALSE,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reações (tabela separada — normalização)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, emoji, user_id)
);

-- Comentários
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_name TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message TEXT
);

-- Participantes de chat (relacionamento N:M)
CREATE TABLE chat_participants (
  chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  unread_count INT DEFAULT 0,
  PRIMARY KEY (chat_id, user_id)
);

-- Mensagens
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts salvos (relacionamento N:M)
CREATE TABLE saved_posts (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Denúncias
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  preview TEXT,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Solicitações de acesso
CREATE TABLE member_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT,
  matricula TEXT,
  category user_role NOT NULL,
  current_post TEXT,
  status request_status DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id, created_at);
CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_member_requests_status ON member_requests(status);
```

---

## 3. Mapeamento de Serviços

| Serviço Firebase | Supabase Equivalente | Alteração |
|---|---|---|
| `firebase/auth` | `@supabase/supabase-js` `supabase.auth` | Substituir métodos de login/logout |
| `onAuthStateChanged` | `supabase.auth.onAuthStateChange` | Mesma semântica, assinatura ligeiramente diferente |
| `signInWithEmailAndPassword` | `supabase.auth.signInWithPassword` | Equivalente direto |
| `sendPasswordResetEmail` | `supabase.auth.resetPasswordForEmail` | Equivalente direto |
| `signOut` | `supabase.auth.signOut` | Equivalente direto |
| `collection(db, 'posts')` | `supabase.from('posts').select('*')` | SQL em vez de NoSQL |
| `onSnapshot(q, cb)` | `supabase.channel('posts').on('postgres_changes', cb)` | Realtime via WebSocket |
| `addDoc(collection, data)` | `supabase.from('posts').insert(data)` | Equivalente direto |
| `updateDoc(doc, data)` | `supabase.from('posts').update(data).eq('id', id)` | Equivalente direto |
| `getDoc(doc)` | `supabase.from('posts').select('*').eq('id', id).single()` | Equivalente direto |
| `serverTimestamp()` | `new Date().toISOString()` ou `NOW()` no Postgres | Timestamp gerado pelo cliente ou banco |
| `increment(1)` | `UPDATE posts SET comment_count = comment_count + 1` | Trigger PostgreSQL ou RPC |
| `writeBatch` | Transação explícita ou RPC Postgres | Melhor — transações ACID garantidas |

---

## 4. Mudanças Estruturais no Código

### 4.1 AuthContext (`src/contexts/AuthContext.tsx`)

Hoje: `authService.onAuthStateChanged` faz login no Firebase Auth, depois `getDoc` no Firestore para buscar perfil.

Supabase: `supabase.auth.onAuthStateChange` entrega o user. O perfil está na tabela `users` com `id = auth.users.id`. Usar RLS (Row Level Security) para garantir que cada usuário só lê seu próprio perfil.

```typescript
// Antes
const unsubscribe = authService.onAuthStateChanged((u, p) => {
  setUser(u);
  setProfile(p);
});

// Depois
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUser(session.user);
      setProfile(profile);
    } else {
      setUser(null);
      setProfile(null);
    }
  }
);
```

### 4.2 Realtime — Substituir `onSnapshot`

Hoje: `postService.subscribeToFeed` usa `onSnapshot` do Firestore.

Supabase: Canal Realtime com filtro por tabela.

```typescript
// Antes (Firestore)
return onSnapshot(q, (snap) => {
  onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

// Depois (Supabase)
const channel = supabase
  .channel('feed')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    // payload.new / payload.old
    // Refazer a query ou aplicar delta local
    refetchPosts();
  })
  .subscribe();

return () => supabase.removeChannel(channel);
```

**Nota**: Supabase Realtime não ordena nem filtra — ele notifica sobre mudanças em linhas. O cliente deve refazer a query (`supabase.from('posts').select(...).order(...)`) quando receber um evento, ou manter estado local e aplicar deltas.

### 4.3 Paginação — Cursor Firestore vs Offset/Limit SQL

Hoje: `startAfter(lastDoc)` com `QueryDocumentSnapshot`.

Supabase: `limit` + `range` ou `cursor` via `id > lastId`.

```typescript
// Antes
const snap = await getDocs(query(postsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(10)));

// Depois
const { data } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .lt('created_at', lastCreatedAt)  // ou range()
  .limit(10);
```

### 4.4 Reações — De Mapa Aninhado para Tabela Relacional

Hoje: `reactions: Record<string, string[]>` é um campo no documento do post.

Problema: Race conditions quando dois usuários reagem simultaneamente (Firebase não tem transações atômicas para arrays dentro de documentos).

Supabase: Tabela `reactions` com `UNIQUE(post_id, emoji, user_id)`.

```sql
-- Toggle reaction via INSERT/DELETE
INSERT INTO reactions (post_id, emoji, user_id)
VALUES ('uuid-post', '👍', 'uuid-user')
ON CONFLICT (post_id, emoji, user_id) DO NOTHING;

-- Se já existia, deletar:
DELETE FROM reactions
WHERE post_id = 'uuid-post' AND emoji = '👍' AND user_id = 'uuid-user';
```

Isso pode ser encapsulado numa **RPC/Function** do Supabase para fazer toggle em uma chamada.

### 4.5 Menções — De Query Cliente para SQL

Hoje: `userService.getAllUsers()` busca 50 usuários no cliente e faz `string.includes('@nome')`.

Supabase: CTE ou subquery SQL que busca usuários mencionados diretamente.

```sql
-- Encontrar usuários mencionados em um texto
SELECT u.id, u.name
FROM users u
WHERE position(lower('@' || u.name) in lower(:text)) > 0
  AND u.id != :actor_id;
```

Ou, melhor: parsear menções no cliente e verificar existência via `IN`.

### 4.6 Comentários — De Subcoleção para Tabela

Hoje: `posts/{postId}/comments` é uma subcoleção no Firestore.

Supabase: `comments` é uma tabela com `post_id` como FK. Isso permite:
- `JOIN` com `users` para mostrar avatar/bio do autor
- `COUNT` eficiente (hoje usa `commentCount` manual)
- Índice para ordenação

**Trigger para atualizar `comment_count` automaticamente:**

```sql
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();
```

---

## 5. Estratégia de Migração de Dados

### 5.1 Exportar do Firebase

Usar o **Firebase Admin SDK** em um script Node.js separado:

```bash
# Instalar firebase-admin
npm install firebase-admin

# Criar script de exportação
node scripts/export-firebase-data.js
```

O script deve:
1. Autenticar com service account
2. Iterar todas as coleções: `users`, `posts`, `comments` (subcoleção), `chats`, `messages` (subcoleção), `notifications`, `reports`, `memberRequests`
3. Salvar como JSON ou CSV

### 5.2 Transformar

Tarefas de transformação necessárias:

| Transformação | Motivo |
|---|---|
| `firestoreId` (string aleatória) → `UUID` | PostgreSQL usa UUID nativo; mapear IDs antigos para novos UUIDs |
| `createdAt: Timestamp` → `created_at: ISO string` | PostgreSQL `TIMESTAMPTZ` |
| `reactions: {emoji: [userIds]}` → `reactions` (tabela) | Normalização |
| `savedPosts: [postIds]` → `saved_posts` (tabela) | Normalização |
| `subcoleção comments` → `comments` (tabela) | Flattening |
| `subcoleção messages` → `chat_messages` (tabela) | Flattening |

### 5.3 Importar para Supabase

Usar **Supabase CLI** ou **Postgres COPY**:

```bash
# Via Supabase CLI
supabase db reset
supabase seed

# Ou via psql direto
psql $SUPABASE_DB_URL -f migrations/001_schema.sql
psql $SUPABASE_DB_URL -c "\COPY posts FROM 'posts.csv' CSV HEADER;"
```

### 5.4 Migração de Auth

Supabase Auth não permite importar senhas diretamente (senhas são hashed com bcrypt). Opções:

1. **Reinvitar usuários**: Enviar email de "redefinir senha" para todos os usuários existentes. Eles clicam, definem nova senha no Supabase.
2. **Hash migration**: Usar a função `supabase.auth.admin.generateLink('recovery', email)` para criar links de recuperação em massa.
3. **Custom JWT bridge**: Manter Firebase Auth temporariamente enquanto migra perfis. Mais complexo, mas sem downtime de login.

**Recomendado**: Opção 1 para uma comunidade pequena e fechada (200 usuários). Comunicar com antecedência: "estamos mudando a plataforma de infra — redefina sua senha na próxima vez que entrar."

---

## 6. Row Level Security (RLS) — O Firewall de Dados

Supabase usa RLS para segurança no nível da linha. Isso substitui as "regras de segurança" do Firestore.

```sql
-- Usuários só podem ver seu próprio perfil (exceto ADMIN)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

-- Posts são públicos para membros ativos
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts visible to all members" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Notificações: só o destinatário vê
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users mark own notifications read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat: só participantes veem mensagens
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants see messages" ON chat_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );
```

---

## 7. Cronograma de Sprints

### Sprint 1 — Fundação (2 semanas)
- [ ] Criar projeto Supabase
- [ ] Definir schema SQL (tabelas, enums, índices, triggers)
- [ ] Configurar RLS policies básicas
- [ ] Criar `src/lib/supabase.ts` (cliente singleton)
- [ ] Migrar `authService.ts` para Supabase Auth
- [ ] Atualizar `AuthContext` para usar Supabase
- [ ] Testar login/logout/cadastro no Supabase

### Sprint 2 — Posts e Feed (2 semanas)
- [ ] Migrar `postService.ts` para Supabase
- [ ] Substituir `onSnapshot` feed por Realtime + refetch
- [ ] Migrar paginação (`fetchMorePosts`) para SQL offset/limit
- [ ] Migrar reações de Mapa Aninhado → tabela `reactions`
- [ ] Criar trigger para `comment_count` automático
- [ ] Testar feed completo (posts, comentários, reações)

### Sprint 3 — Chat e Notificações (2 semanas)
- [ ] Migrar `chatService.ts` para Supabase
- [ ] Tabela `chat_sessions` + `chat_participants` + `chat_messages`
- [ ] Substituir `onSnapshot` de mensagens por Realtime
- [ ] Migrar `notificationService.ts`
- [ ] Testar chat em tempo real

### Sprint 4 — Admin e Perfil (2 semanas)
- [ ] Migrar `userService.ts`
- [ ] Migrar `adminService.ts` (solicitações, denúncias)
- [ ] Migrar `reportService.ts`
- [ ] Migrar `memberRequestService.ts` (ou deletar se for pass-through)
- [ ] Testar painel admin completo

### Sprint 5 — Migração de Dados e Go-Live (1 semana)
- [ ] Script de exportação do Firebase
- [ ] Script de transformação
- [ ] Script de importação para Supabase
- [ ] Enviar emails de redefinição de senha para todos os usuários
- [ ] Soft launch (beta testers)
- [ ] Go-live completo

**Total estimado: 9 semanas (2 meses)** para migração total.

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Realtime do Supabase não escala para 200+ conexões | Baixa | Alto | Monitorar; upgrade para Pro ($25/mês) adiciona 500 conexões |
| Dados do Firestore não mapeiam 1:1 para SQL | Média | Médio | Script de transformação com validação; rodar em staging primeiro |
| Usuários perdendo acesso (senhas não migráveis) | Alta | Médio | Comunicação antecipada + email de redefinição de senha em massa |
| Queries SQL mais lentas que Firestore para casos simples | Baixa | Baixo | Índices adequados; PostgreSQL é mais rápido para JOINs e agregações |
| Downtome durante a migração | Média | Alto | Soft launch com beta; manter Firebase rodando em paralelo até validação completa |
| Bugs em RLS policies bloqueando usuários legítimos | Média | Médio | Testar todas as policies com usuários de cada role; usar `supabase.auth.getUser()` |

---

## 9. Alternativa Híbrida (menor risco)

Se a migração total parece muito arriscada, considere uma **migração gradual**:

1. **Fase 1 (1 mês)**: Migrar só o Auth para Supabase Auth. Manter Firestore para dados. Isso já resolve o problema de "usuários sem perfil são deslogados" e permite usar as features de auth do Supabase (mais barato/previsível).

2. **Fase 2 (2 meses)**: Migrar posts e feed para Supabase PostgreSQL, mantendo chat e notificações no Firestore.

3. **Fase 3 (2 meses)**: Migrar chat e notificações.

Essa abordagem reduz o risco, mas aumenta a complexidade temporária (dois bancos). Recomendado só se o time for pequeno ou inexperiente com PostgreSQL.

---

## 10. Checklist de Go-Live

- [ ] Todos os serviços migrados para Supabase
- [ ] Todos os testes passando
- [ ] RLS policies auditadas
- [ ] Script de backup automático configurado (Supabase Pro tem backups diários; free precisa de script manual)
- [ ] Dados de produção migrados e validados
- [ ] Emails de redefinição de senha enviados
- [ ] Beta test com 5-10 usuários
- [ ] Firebase desativado (regras de segurança restringindo acesso)
- [ ] Monitoramento de erro (Sentry/Logflare) configurado
- [ ] Documentação de emergência (como reverter para Firebase em caso de catástrofe)

---

## 11. Custo Projetado

| Fase | Custo |
|---|---|
| Desenvolvimento (2 meses) | $0 (free tier) |
| Pós-go-live (ano 1) | $0 (free tier, <500 MB dados) |
| Ano 3-4 (se crescer além de 500 MB) | $25/mês (Pro) |
| Auth (50.000 MAU) | $0 (incluído no free tier) |

**Economia vs Firebase**: Firestore cobra por leitura/escrita. Supabase free cobra por armazenamento. Para uma rede social interna com uso moderado, Supabase é significativamente mais barato.

---

*Plano gerado em 2026-06-08. Revisar antes da execução.*
