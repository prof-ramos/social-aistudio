import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatSession, ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { ChevronLeft, Send, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button, Card, PageTitle } from '../components/ui';

export function Messages({ profile }: { profile: UserProfile }) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = chatService.subscribeToUserChats(profile.id, (fetchedChats) => {
      setChats(fetchedChats);

      const state = location.state as { targetUserId?: string, targetUserName?: string } | null;
      if (state?.targetUserId && state.targetUserId !== profile.id) {
        const existingChat = fetchedChats.find(c => c.participants.includes(state.targetUserId!));
        if (existingChat) {
          setActiveChatId(existingChat.id);
          window.history.replaceState({}, document.title)
        } else {
          chatService.getOrCreateChat(profile.id, state.targetUserId, profile.name, state.targetUserName || 'Usuário').then(id => {
            setActiveChatId(id);
            window.history.replaceState({}, document.title)
          });
        }
      }
    });
    return () => unsub();
  }, [profile.id, location.state]);

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

  const activeChat = chats.find(c => c.id === activeChatId);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card variant="elevated" padding="none" className="flex flex-1 min-h-0 overflow-hidden rounded-md relative z-0">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-80 flex-none border-r border-border-gray flex flex-col bg-white transition-all ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-border-gray flex items-center justify-between">
          <PageTitle as="h2" size="lg" className="text-xl">Mensagens</PageTitle>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate text-sm flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-ice flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-navy opacity-50" />
              </div>
              <p className="font-medium text-navy">Nenhuma conversa</p>
              <p className="mt-1 opacity-70">Suas mensagens aparecerão aqui.</p>
            </div>
          ) : (
            chats.map(chat => {
              const otherId = chat.participants.find(p => p !== profile.id) || profile.id;
              const otherName = chat.participantNames?.[otherId] || 'Usuário';
              const isActive = chat.id === activeChatId;
              const initial = otherName.charAt(0).toUpperCase();

              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-border-gray/30 hover:bg-ice/50 transition-colors text-left focus:outline-none focus:bg-ice/80 ${isActive ? 'bg-ice/80' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">{initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-sm text-navy truncate">{otherName}</p>
                      <span className="text-[10px] text-slate/60 shrink-0 ml-2">
                        {chat.updatedAt ? formatTime(chat.updatedAt) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate truncate">{chat.lastMessage || 'Envie a primeira mensagem...'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main - Chat Area */}
      <div className={`flex-1 flex flex-col bg-ice relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-border-gray flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-navy" />
              </div>
              <PageTitle as="h2" size="lg">Suas Mensagens</PageTitle>
              <p className="text-slate text-sm leading-relaxed mt-2">
                Selecione uma conversa na lista ao lado ou inicie um novo bate-papo a partir do perfil de um membro.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 px-4 border-b border-border-gray flex items-center gap-3 bg-white z-10 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveChatId(null)}
                className="md:hidden w-10 h-10 -ml-2 rounded-full p-0"
                title="Voltar"
              >
                <ChevronLeft className="w-5 h-5 text-navy" />
              </Button>

              {activeChat && (() => {
                 const otherId = activeChat.participants.find(p => p !== profile.id) || profile.id;
                 const otherName = activeChat.participantNames?.[otherId] || 'Usuário';
                 return (
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center shrink-0">
                       <span className="text-white font-bold">{otherName.charAt(0).toUpperCase()}</span>
                     </div>
                     <div>
                       <h3 className="font-bold text-navy text-sm">{otherName}</h3>
                     </div>
                   </div>
                 );
              })()}
            </div>

            {/* Messages */}
            <div role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === profile.id;
                const showTime = true; // In a fuller app, conditionally show based on prev message time
                return (
                  <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-[15px] shadow-sm relative ${
                        isMe
                          ? 'bg-navy text-white rounded-t-2xl rounded-l-2xl rounded-br-sm'
                          : 'bg-white border border-border-gray/50 text-slate rounded-t-2xl rounded-r-2xl rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                    </div>
                    {showTime && (
                       <span className="text-[10px] text-slate/50 mt-1 px-1">
                         {formatTime(msg.createdAt)}
                       </span>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-border-gray shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 h-12 bg-ice/50 border border-border-gray/50 rounded-full px-5 text-base focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy focus:outline-none transition-all"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={sending}
                  aria-label="Nova mensagem"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!newMessage.trim() || sending}
                  className="w-12 h-12 rounded-full p-0 shrink-0"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
