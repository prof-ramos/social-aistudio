import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../ui/command';
import { Home, MessageSquare, Bell, User, Shield, Compass } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        const active = document.activeElement;
        if (active && active.closest('.ProseMirror')) {
          return;
        }
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const run = useCallback(
    (action: () => void) => {
      setOpen(false);
      action();
    },
    []
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Menu de navegação">
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => run(() => navigate('/feed'))}>
            <Home className="w-4 h-4" aria-hidden="true" />
            Feed
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate('/mensagens'))}>
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            Mensagens
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate('/notificacoes'))}>
            <Bell className="w-4 h-4" aria-hidden="true" />
            Notificações
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => navigate(`/perfil/${profile?.id}`))
            }
          >
            <User className="w-4 h-4" aria-hidden="true" />
            Perfil
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate('/postos'))}>
            <Compass className="w-4 h-4" aria-hidden="true" />
            Postos
          </CommandItem>
          {profile?.role === 'ADMIN' && (
            <CommandItem onSelect={() => run(() => navigate('/admin'))}>
              <Shield className="w-4 h-4" aria-hidden="true" />
              Painel Admin
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
