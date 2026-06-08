-- Schema PostgreSQL para Social-ASOF
-- Execute no SQL Editor do Supabase

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBRO_ATIVO', 'MEMBRO_APOSENTADO', 'PENDENTE');
CREATE TYPE post_category AS ENUM ('POSTOS', 'CARREIRA', 'VIDA_EXTERIOR', 'APOSENTADORIA', 'GERAL');
CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED_KEPT', 'RESOLVED_WARNED', 'RESOLVED_REMOVED');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Tabela de usuários (sincronizada com Supabase Auth via trigger)
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

-- Trigger: atualizar comment_count automaticamente
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

-- Trigger: sincronizar usuário do Auth para tabela users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'PENDENTE')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts visible to all" ON posts FOR SELECT USING (true);
CREATE POLICY "Users create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "Comments visible with post" ON comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM posts WHERE posts.id = comments.post_id
  ));
CREATE POLICY "Users create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Reactions visible with post" ON reactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM posts WHERE posts.id = reactions.post_id
  ));
CREATE POLICY "Users manage own reactions" ON reactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Chat participants see sessions" ON chat_sessions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM chat_participants WHERE chat_id = chat_sessions.id AND user_id = auth.uid()
  ));

CREATE POLICY "Chat participants see messages" ON chat_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM chat_participants WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users send messages in chats" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM chat_participants WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users see own saved posts" ON saved_posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own saved posts" ON saved_posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins see all reports" ON reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));
CREATE POLICY "Users create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins manage requests" ON member_requests
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));
CREATE POLICY "Anyone create requests" ON member_requests
  FOR INSERT WITH CHECK (true);
