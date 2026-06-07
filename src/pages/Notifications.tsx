import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import { Bell, Check, Info } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function Notifications({ profile }: { profile: UserProfile }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications(profile.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <div className="flex items-end justify-between mb-8">
        <h1 className="text-4xl text-navy font-serif">Notificações</h1>
        <button 
          onClick={markAllAsRead} 
          disabled={!notifications.some(n => !n.read)}
          className="text-sm font-medium p-2 text-navy hover:text-sky transition-colors cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px] flex items-center justify-center shrink-0"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="bg-white border border-border-gray shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg text-navy mb-1">Nenhuma notificação</p>
            <p className="text-sm">Você não possui novas atualizações no momento.</p>
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
                     {n.link && <Link to={n.link} className="text-navy hover:text-sky transition-colors">Acessar</Link>}
                  </div>
                </div>
                {!n.read && (
                  <button onClick={() => markAsRead(n.id)} className="text-xs p-2 min-h-[44px] text-sky font-bold hover:text-navy transition-colors self-start whitespace-nowrap focus:ring-2 focus:ring-navy focus:outline-none flex items-center justify-center">
                    MARCAR LIDA
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
