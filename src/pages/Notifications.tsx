import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import { Bell, Check, Info } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Button, Card, PageTitle } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';

function isExternalLink(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function Notifications({ profile }: { profile: UserProfile }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications(profile.id);

  return (
    <PageContainer variant="narrow" className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <PageTitle>Notificações</PageTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllAsRead}
          disabled={!notifications.some(n => !n.read)}
        >
          Marcar todas como lidas
        </Button>
      </div>

      <Card variant="elevated" padding="none">
        {notifications.length === 0 ? (
          <div className="py-16 px-6 text-center text-slate bg-white flex flex-col items-center justify-center">
            <Bell className="w-12 h-12 mb-4 opacity-20 text-navy" />
            <p className="font-serif text-xl text-navy mb-2">Nenhuma notificação</p>
            <p className="text-sm opacity-80 max-w-sm mx-auto">Você não possui novas atualizações no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-gray">
            {notifications.map(n => (
              <div key={n.id} className={`p-5 flex gap-4 transition-colors ${n.read ? 'opacity-70' : 'bg-ice/30'}`}>
                <div className="w-10 h-10 shrink-0 bg-ice border border-border-gray flex items-center justify-center text-navy rounded-full">
                  {n.type === 'APPROVAL' ? <Check className="w-5 h-5 text-success" /> : n.type === 'MENTION_POST' || n.type === 'MENTION_COMMENT' ? <span className="font-bold text-lg text-sky">@</span> : <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate mb-1">{n.message}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate opacity-70">
                     <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                     {n.link && (
                       isExternalLink(n.link) ? (
                         <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-sky transition-colors">Acessar</a>
                       ) : (
                         <Link to={n.link} className="text-navy hover:text-sky transition-colors">Acessar</Link>
                       )
                     )}
                  </div>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(n.id)}
                    className="self-start whitespace-nowrap"
                  >
                    MARCAR LIDA
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
