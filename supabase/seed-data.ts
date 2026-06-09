/**
 * Seed Script: Populate Supabase with test data
 *
 * Usage:
 *   npx tsx supabase/seed-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SEED_PASSWORD = process.env.SEED_PASSWORD || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('SEED_PASSWORD must be set in production'); })()
    : 'dev-seed-password-change-me'
);

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function log(...args: any[]) {
  console.log('[seed]', ...args);
}

async function createTestUser(
  email: string,
  name: string,
  password: string
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    log('  CreateUser error for', email, ':', error.message);
    return null;
  }

  return data.user?.id ?? null;
}

async function seed() {
  log('Creating test data...');

  // ─── Create 3 distinct test users ────────────────────────────
  const u1 = await createTestUser('test1@asof.org.br', 'Maria Silva', SEED_PASSWORD);
  const u2 = await createTestUser('test2@asof.org.br', 'João Pereira', SEED_PASSWORD);
  const u3 = await createTestUser('test3@asof.org.br', 'Ana Costa', SEED_PASSWORD);

  if (!u1 || !u2 || !u3) {
    log('Failed to create test users');
    process.exit(1);
  }

  log('  Created users:', u1, u2, u3);

  // ─── Create profiles in public.users ─────────────────────────
  await admin.from('users').upsert([
    { id: u1, email: 'test1@asof.org.br', name: 'Maria Silva', role: 'MEMBRO_ATIVO', current_post: 'Embaixada em Paris' },
    { id: u2, email: 'test2@asof.org.br', name: 'João Pereira', role: 'MEMBRO_APOSENTADO', current_post: 'Consulado em Nova York' },
    { id: u3, email: 'test3@asof.org.br', name: 'Ana Costa', role: 'MEMBRO_ATIVO', current_post: 'Embaixada em Tóquio' },
  ]);
  log('  Profiles created');

  // ─── Create posts ──────────────────────────────────────────────
  const posts = [
    { title: 'Bem-vindos à nova plataforma!', body: '<p>Estamos felizes em anunciar a migração para o novo sistema.</p>', category: 'GERAL', author_id: u1, pinned: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { title: 'Dúvidas sobre postos na Europa', body: '<p>Alguém tem experiência recente em postos na Europa? Gostaria de saber sobre condições de moradia.</p>', category: 'POSTOS', author_id: u3, pinned: false, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { title: 'Reforma da previdência e aposentadoria', body: '<p>Como as mudanças recentes afetam os diplomatas?</p>', category: 'APOSENTADORIA', author_id: u2, pinned: false, created_at: new Date(Date.now() - 12 * 3600000).toISOString() },
  ];

  const { data: insertedPosts, error: postError } = await admin.from('posts').insert(posts).select();
  if (postError) {
    log('  Error inserting posts:', postError.message);
    return;
  }
  log(`  ${insertedPosts?.length ?? 0} posts created`);

  // ─── Create comments ───────────────────────────────────────────
  if (insertedPosts && insertedPosts.length > 0) {
    const comments = [
      { post_id: insertedPosts[0].id, author_id: u2, body: 'Ótima iniciativa! Parabéns a todos.', created_at: new Date(Date.now() - 1.5 * 86400000).toISOString() },
      { post_id: insertedPosts[0].id, author_id: u3, body: 'Concordo plenamente. Vamos aproveitar a nova plataforma.', created_at: new Date(Date.now() - 1.2 * 86400000).toISOString() },
      { post_id: insertedPosts[1].id, author_id: u1, body: 'Tenho informações sobre Berlim e Viena. Posso compartilhar depois.', created_at: new Date(Date.now() - 0.5 * 86400000).toISOString() },
    ];

    const { error: commentError } = await admin.from('comments').insert(comments);
    if (commentError) log('  Error inserting comments:', commentError.message);
    else log(`  ${comments.length} comments created`);
  }

  // ─── Create reactions ──────────────────────────────────────────
  if (insertedPosts && insertedPosts.length > 0) {
    const reactions = [
      { post_id: insertedPosts[0].id, emoji: '👍', user_id: u2 },
      { post_id: insertedPosts[0].id, emoji: '👍', user_id: u3 },
      { post_id: insertedPosts[0].id, emoji: '🎉', user_id: u2 },
      { post_id: insertedPosts[1].id, emoji: '❤️', user_id: u1 },
    ];

    const { error: reactionError } = await admin.from('reactions').insert(reactions);
    if (reactionError) log('  Error inserting reactions:', reactionError.message);
    else log(`  ${reactions.length} reactions created`);
  }

  // ─── Create postos ───────────────────────────────────────────
  const postos = [
    { name: 'Embaixada do Brasil em Paris', slug: 'embaixada-paris', city: 'Paris', country: 'França', description: 'Representação diplomática na França.' },
    { name: 'Consulado Geral em Nova York', slug: 'consulado-nova-york', city: 'Nova York', country: 'EUA', description: 'Atendimento aos brasileiros na costa leste dos EUA.' },
    { name: 'Embaixada do Brasil em Tóquio', slug: 'embaixada-toquio', city: 'Tóquio', country: 'Japão', description: 'Representação diplomática no Japão.' },
  ];

  const { data: insertedPostos, error: postoError } = await admin.from('postos').insert(postos).select();
  if (postoError) log('  Error inserting postos:', postoError.message);
  else log(`  ${insertedPostos?.length ?? 0} postos created`);

  // ─── Create reviews ────────────────────────────────────────────
  if (insertedPostos && insertedPostos.length > 0) {
    const reviews = [
      { posto_id: insertedPostos[0].id, author_id: u1, author_name: 'Maria Silva', author_role: 'MEMBRO_ATIVO', category: 'Moradia', body: 'Excelente apartamento na região do 7º arrondissement.', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { posto_id: insertedPostos[1].id, author_id: u3, author_name: 'Ana Costa', author_role: 'MEMBRO_ATIVO', category: 'Educação', body: 'Boa escola brasileira na região.', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    ];

    const { error: reviewError } = await admin.from('reviews').insert(reviews);
    if (reviewError) log('  Error inserting reviews:', reviewError.message);
    else log(`  ${reviews.length} reviews created`);
  }

  // ─── Create chat session ─────────────────────────────────────
  const { data: chatSession, error: chatError } = await admin.from('chat_sessions').insert({}).select().single();
  if (chatError) {
    log('  Error creating chat session:', chatError.message);
  } else if (chatSession) {
    const participants = [
      { chat_id: chatSession.id, user_id: u1, display_name: 'Maria Silva' },
      { chat_id: chatSession.id, user_id: u2, display_name: 'João Pereira' },
    ];
    const { error: partError } = await admin.from('chat_participants').insert(participants);
    if (partError) log('  Error inserting participants:', partError.message);

    const messages = [
      { chat_id: chatSession.id, sender_id: u1, body: 'Oi! Tudo bem?', read: true, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { chat_id: chatSession.id, sender_id: u2, body: 'Tudo sim! E você?', read: true, created_at: new Date(Date.now() - 1.8 * 3600000).toISOString() },
      { chat_id: chatSession.id, sender_id: u1, body: 'Bem também. Vamos marcar um café?', read: false, created_at: new Date(Date.now() - 0.5 * 3600000).toISOString() },
    ];
    const { error: msgError } = await admin.from('chat_messages').insert(messages);
    if (msgError) log('  Error inserting messages:', msgError.message);
    else log(`  Chat session created with ${messages.length} messages`);

    await admin.from('chat_sessions').update({
      last_message: messages[messages.length - 1].body,
      updated_at: messages[messages.length - 1].created_at,
    }).eq('id', chatSession.id);
  }

  // ─── Create notifications ────────────────────────────────────
  const notifications = [
    { user_id: u1, type: 'MENTION_POST', actor_name: 'João Pereira', post_id: insertedPosts?.[0]?.id, message: 'João Pereira mencionou você em um post', link: `/feed/${insertedPosts?.[0]?.id}`, read: false, created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
    { user_id: u3, type: 'COMMENT', actor_name: 'Maria Silva', post_id: insertedPosts?.[1]?.id, message: 'Maria Silva comentou no seu post', link: `/feed/${insertedPosts?.[1]?.id}`, read: true, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  ];

  const { error: notifError } = await admin.from('notifications').insert(notifications);
  if (notifError) log('  Error inserting notifications:', notifError.message);
  else log(`  ${notifications.length} notifications created`);

  log('\n✅ Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
