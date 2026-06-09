import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatSession, ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { ChevronLeft, Send, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button, Card, PageTitle } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';
import { useVisualViewportOffset } from '../hooks/useVisualViewportOffset';

export function Messages({ profile }: { profile: UserProfile }) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const keyboardOffset = useVisualViewportOffset();

  useEffect(() => {
    const unsub = chatService.subscribeToUserChats(profile.id, (fetchedChats) => {
      setChats(fetchedChats);

      const state = location.state as { targetUserId?: string; targetUserName?: string } | null;
      if (state?.targetUserId && state.targetUserId !== profile.id) {
        const existingChat = fetchedChats.find((c) => c.participants.includes(state.targetUserId!));
        if (existingChat) {
          setActiveChatId(existingChat.id);
          window.history.replaceState({}, document.title);
        } else {
          chatService
            .getOrCreateChat(profile.id, state.targetUserId, profile.name, state.targetUserName || 'Usuário')
            .then((id) => {
              setActiveChatId(id);
              window.history.replaceState({}, document.title);
            });
        }
      }
    });
    return () => unsub();
  }, [profile.id, location.state, profile.name]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const unsub = chatService.subscribeToChatMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsub();
  }, [activeChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;
    setSending(true);
    try {
      await chatService.sendMessage(activeChatId, profile.id, newMessage);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageContainer variant="full" className="flex min-h-0 flex-1 flex-col">
      <Card
        variant="elevated"
        padding="none"
        className="relative z-0 flex min-h-0 flex-1 overflow-hidden rounded-none"
      >
        {/* Sidebar - Chat List */}
        <div
          className={`flex w-full flex-none flex-col border-r border-border-gray bg-white transition-all md:w-80 ${
            activeChatId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border-gray p-5">
            <PageTitle as="h1" size="lg" className="text-xl">
              Mensagens
            </PageTitle>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-slate">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ice">
                  <MessageSquare className="h-5 w-5 text-navy opacity-50" />
                </div>
                <p className="font-medium text-navy">Nenhuma conversa</p>
                <p className="mt-1 opacity-70">Suas mensagens aparecerão aqui.</p>
              </div>
            ) : (
              chats.map((chat) => {
                const otherId = chat.participants.find((p) => p !== profile.id) || profile.id;
                const otherName = chat.participantNames?.[otherId] || 'Usuário';
                const isActive = chat.id === activeChatId;
                const initial = otherName.charAt(0).toUpperCase();

                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`flex w-full min-h-[44px] items-center gap-3 border-b border-border-gray/30 p-4 text-left transition-colors hover:bg-ice/50 focus:bg-ice/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-navy ${
                      isActive ? 'bg-ice/80' : ''
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy">
                      <span className="text-lg font-bold text-white">{initial}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between">
                        <p className="truncate text-sm font-bold text-navy">{otherName}</p>
                        <span className="ml-2 shrink-0 text-[10px] text-slate/70">
                          {chat.updatedAt ? formatTime(chat.updatedAt) : ''}
                        </span>
                      </div>
                      <p className="truncate text-sm text-slate">
                        {chat.lastMessage || 'Envie a primeira mensagem...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main - Chat Area */}
        <div
          className={`relative flex min-h-0 flex-1 flex-col bg-ice ${
            !activeChatId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!activeChatId ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border-gray bg-white shadow-sm">
                  <MessageSquare className="h-6 w-6 text-navy" />
                </div>
                <PageTitle as="h2" size="lg">
                  Suas Mensagens
                </PageTitle>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  Selecione uma conversa na lista ao lado ou inicie um novo bate-papo a partir do perfil de um membro.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border-gray bg-white px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveChatId(null)}
                  className="-ml-2 min-h-[44px] min-w-[44px] rounded-full p-0 md:hidden"
                  title="Voltar"
                >
                  <ChevronLeft className="h-5 w-5 text-navy" />
                </Button>

                {activeChat &&
                  (() => {
                    const otherId = activeChat.participants.find((p) => p !== profile.id) || profile.id;
                    const otherName = activeChat.participantNames?.[otherId] || 'Usuário';
                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy">
                          <span className="font-bold text-white">{otherName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-navy">{otherName}</h2>
                        </div>
                      </div>
                    );
                  })()}
              </div>

              <div
                role="log"
                aria-live="polite"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
              >
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === profile.id;
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`relative max-w-[85%] px-4 py-2.5 text-[15px] shadow-sm sm:max-w-[70%] ${
                          isMe
                            ? 'rounded-t-2xl rounded-l-2xl rounded-br-sm bg-navy text-white'
                            : 'rounded-t-2xl rounded-r-2xl rounded-bl-sm border border-border-gray/50 bg-white text-slate'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                      </div>
                      <span className="mt-1 px-1 text-[10px] text-slate/70">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div
                className="sticky bottom-0 z-10 shrink-0 border-t border-border-gray bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                style={{ transform: keyboardOffset ? `translateY(-${keyboardOffset}px)` : undefined }}
              >
                <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl gap-2">
                  <input
                    type="text"
                    placeholder="Escreva sua mensagem..."
                    className="h-12 flex-1 rounded-full border border-border-gray/50 bg-ice/50 px-5 text-base transition-all focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    aria-label="Nova mensagem"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!newMessage.trim() || sending}
                    className="h-12 w-12 shrink-0 rounded-full p-0"
                    aria-label="Enviar mensagem"
                  >
                    <Send className="ml-0.5 h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}