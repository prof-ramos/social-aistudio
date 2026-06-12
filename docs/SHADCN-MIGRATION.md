# Migração shadcn/ui — Social ASOF

> Documento gerado em 2026-06-11.  
> Baseado no estado atual do repositório: Tailwind 4.1.14, React 19, Vite 6, TypeScript 5.8.

---

## Sumário

- [Contexto e premissas](#contexto-e-premissas)
- [Mapeamento de componentes](#mapeamento-de-componentes)
- [Sprint 0 — Configuração base](#sprint-0--configuração-base)
- [Sprint 1 — Primitivos de formulário](#sprint-1--primitivos-de-formulário)
- [Sprint 2 — Diálogos e alertas](#sprint-2--diálogos-e-alertas)
- [Sprint 3 — Navegação e busca](#sprint-3--navegação-e-busca)
- [Sprint 4 — Feedback e badges](#sprint-4--feedback-e-badges)
- [Sprint 5 — Tabelas, tabs e avatar](#sprint-5--tabelas-tabs-e-avatar)
- [Sprint 6 — Cards e navegação estrutural](#sprint-6--cards-e-navegação-estrutural)
- [O que não migra](#o-que-não-migra)
- [Variáveis CSS — mapeamento completo](#variáveis-css--mapeamento-completo)
- [Critérios de definição de pronto](#critérios-de-definição-de-pronto)

---

## Contexto e premissas

### Por que shadcn/ui?

O projeto já usa todas as dependências que shadcn espera:

| Dependência | Status atual |
|---|---|
| `tailwindcss` ^4.1.14 | ✅ instalado |
| `clsx` + `tailwind-merge` | ✅ instalado, `cn()` em `src/lib/utils.ts` |
| `lucide-react` | ✅ instalado |
| `@radix-ui/*` | ❌ nenhum — será adicionado pelo CLI |

shadcn não é uma biblioteca de pacotes: é um **gerador de código**. Os comandos `npx shadcn@latest add <componente>` copiam o código-fonte diretamente para o repositório, permitindo customização total.

### Tailwind 4 + shadcn

A partir da versão `shadcn@2.x`, o CLI detecta automaticamente projetos Tailwind 4 e usa a sintaxe `@theme inline` em vez de `tailwind.config.ts`. O arquivo `src/index.css` é o ponto central de configuração — o CLI vai escrever variáveis CSS nele.

### Alias de path

O projeto usa `@/` apontando para a **raiz do repositório** (não `src/`):

```ts
// vite.config.ts
alias: { '@': path.resolve(__dirname, '.') }

// tsconfig.json
"paths": { "@/*": ["./*"] }
```

O `components.json` deve refletir isso explicitamente, apontando para `@/src/components/ui`.

---

## Mapeamento de componentes

### Componentes atuais → shadcn equivalente

| Arquivo atual | Componente shadcn | CLI command | Ação |
|---|---|---|---|
| `ui/Button.tsx` | `button` | `add button` | Substituir |
| `ui/Card.tsx` | `card` | `add card` | Substituir |
| `ui/Alert.tsx` | `alert` | `add alert` | Substituir |
| `ui/ConfirmDialog.tsx` | `alert-dialog` | `add alert-dialog` | Substituir |
| `ui/ReportDialog.tsx` | `dialog` | `add dialog` | Substituir |
| `ui/Toast.tsx` | `sonner` | `add sonner` | Substituir |
| `ui/StatusBadge.tsx` | `badge` | `add badge` | Wrapper fino |
| `ui/AvatarUpload.tsx` | `avatar` | `add avatar` | Compor sobre |
| `ui/Checkbox.tsx` | `checkbox` | `add checkbox` | Substituir |
| `ui/Breadcrumb.tsx` | `breadcrumb` | `add breadcrumb` | Substituir |
| `ui/Skeleton.tsx` | `skeleton` | `add skeleton` | Substituir |
| `ui/KeyboardShortcuts.tsx` | `dialog` | `add dialog` | Reescrever usando |
| `ui/LoadingUI.tsx` | `skeleton` | — | Adaptar |
| `ui/PageTitle.tsx` | — | — | Manter |
| `ui/OfflineIndicator.tsx` | — | — | Manter |
| `layout/Navbar.tsx` (dropdowns) | `dropdown-menu` | `add dropdown-menu` | Refatorar |
| `layout/GlobalSearchDropdown.tsx` | `command` | `add command` | Reescrever |
| `pages/AdminMembers.tsx` | `table` | `add table` | Refatorar |
| `pages/AdminModeration.tsx` | `table` | `add table` | Refatorar |
| `pages/Profile.tsx` (abas) | `tabs` | `add tabs` | Extrair |
| `pages/PostoDetails.tsx` (abas) | `tabs` | `add tabs` | Extrair |
| Inputs avulsos em pages | `input` | `add input` | Substituir |
| `<select>` avulsos | `select` | `add select` | Substituir |
| `<textarea>` avulsos | `textarea` | `add textarea` | Substituir |
| `<label>` avulsos | `label` | `add label` | Substituir |

### O que não migra

| Componente | Motivo |
|---|---|
| `PostEditor.tsx` (TipTap) | Editor próprio, não há equivalente shadcn |
| `brand/AsofLogo.tsx` | Identidade visual proprietária |
| `brand/AuthShell.tsx` | Layout customizado com animações próprias |
| `brand/BrandLockup.tsx` | Identidade visual proprietária |
| `Tour.tsx` | Terceiro (`react-joyride`), sem equivalente |
| `ErrorBoundary.tsx` | Componente de infraestrutura |
| `ReactionButtons.tsx` | Lógica de negócio específica |

---

## Sprint 0 — Configuração base

**Duração estimada:** 2 dias  
**Risco:** Baixo  
**Objetivo:** Preparar o ambiente sem alterar nenhum componente de produto.

### 0.1 Inicializar shadcn

```bash
npx shadcn@latest init
```

O CLI vai perguntar:

| Pergunta | Resposta recomendada |
|---|---|
| Style | New York |
| Base color | Neutral |
| CSS variables | Yes |
| `components.json` location | raiz do projeto |

> **Por que New York?** O estilo New York usa bordas mais definidas e tipografia mais densa — mais adequado ao tom institucional do Social ASOF do que o estilo Default (mais arredondado/consumer).

### 0.2 Ajustar `components.json` manualmente

O CLI vai gerar um `components.json` padrão. Corrija os aliases para refletir que `@/` aponta para a raiz:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/src/components",
    "utils": "@/src/lib/utils",
    "ui": "@/src/components/ui",
    "lib": "@/src/lib",
    "hooks": "@/src/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 0.3 Mapear variáveis CSS existentes para tokens shadcn

O CLI vai injetar variáveis shadcn em `src/index.css` dentro de `:root` e `.dark`. O projeto tem um sistema de tokens próprio (`--app-navy`, `--app-sky`, etc.). A estratégia é **manter ambos** e fazer os tokens shadcn apontarem para os tokens do projeto:

```css
/* src/index.css — adicionar APÓS as variáveis --app-* existentes */

/* Mapeamento shadcn → tokens ASOF */
:root {
  --background: var(--app-white);
  --foreground: var(--app-navy);
  --card: var(--app-white);
  --card-foreground: var(--app-navy);
  --popover: var(--app-white);
  --popover-foreground: var(--app-navy);
  --primary: var(--app-navy);
  --primary-foreground: var(--app-white-fixed);
  --secondary: var(--app-ice);
  --secondary-foreground: var(--app-navy);
  --muted: var(--app-ice);
  --muted-foreground: var(--app-slate);
  --accent: var(--app-sky);
  --accent-foreground: var(--app-white-fixed);
  --destructive: var(--app-danger);
  --destructive-foreground: var(--app-white-fixed);
  --border: var(--app-border-gray);
  --input: var(--app-border-gray);
  --ring: var(--app-navy);
  --radius: 0rem; /* Estilo quadrado institucional — ajuste se preferir arredondado */
}

.dark {
  --background: var(--app-white);
  --foreground: var(--app-navy);
  --card: var(--app-white);
  --card-foreground: var(--app-navy);
  --popover: var(--app-white);
  --popover-foreground: var(--app-navy);
  --primary: var(--app-navy);
  --primary-foreground: var(--app-white-fixed);
  --secondary: var(--app-ice);
  --secondary-foreground: var(--app-navy);
  --muted: var(--app-ice);
  --muted-foreground: var(--app-slate);
  --accent: var(--app-sky);
  --accent-foreground: var(--app-white-fixed);
  --destructive: var(--app-danger);
  --destructive-foreground: var(--app-white-fixed);
  --border: var(--app-border-gray);
  --input: var(--app-border-gray);
  --ring: var(--app-sky);
}
```

> **Nota sobre `--radius: 0rem`:** O design atual usa cantos quadrados (sem `border-radius`). shadcn usa `rounded-md` em vários componentes, que com `--radius: 0rem` se torna quadrado automaticamente. Se quiser experimentar bordas arredondadas, use `0.375rem`.

### 0.4 Verificar que `cn()` já é compatível

O projeto já tem a utility em `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

shadcn usa exatamente esse padrão. **Nenhuma alteração necessária.**

### 0.5 Definição de pronto — Sprint 0

- [ ] `components.json` presente na raiz com aliases corretos
- [ ] `src/index.css` com variáveis shadcn mapeadas para tokens `--app-*`
- [ ] `npx shadcn@latest add button` executa sem erro e gera `src/components/ui/button.tsx`
- [ ] `npm run lint` passa sem novos erros
- [ ] `npm test` passa (173 testes)

---

## Sprint 1 — Primitivos de formulário

**Duração estimada:** 4 dias  
**Risco:** Baixo  
**Componentes shadcn:** `input`, `textarea`, `select`, `label`, `checkbox`

### Instalar os componentes

```bash
npx shadcn@latest add input textarea select label checkbox
```

Isso cria:
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/select.tsx` (baseado em Radix `@radix-ui/react-select`)
- `src/components/ui/label.tsx` (baseado em Radix `@radix-ui/react-label`)
- `src/components/ui/checkbox.tsx` (baseado em Radix `@radix-ui/react-checkbox`)

### 1.1 Substituir `ui/Checkbox.tsx`

**Antes** — wrapper manual sobre `<input type="checkbox">`:
```tsx
// src/components/ui/Checkbox.tsx (atual)
<input type="checkbox" className="..." />
<label>...</label>
```

**Depois** — usar o gerado pelo CLI em `src/components/ui/checkbox.tsx`.  
O arquivo atual `Checkbox.tsx` pode ser **deletado** e os imports atualizados:

```tsx
// Todos os arquivos que importam Checkbox:
// Buscar: from '../ui/Checkbox' ou from '@/src/components/ui/Checkbox'
// Substituir por: from '@/src/components/ui/checkbox'
```

### 1.2 Substituir inputs em `pages/Login.tsx`

**Antes:**
```tsx
<input
  type="email"
  className="w-full border border-border-gray px-4 py-2 text-base focus:border-navy focus:ring-2 focus:ring-navy"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Depois:**
```tsx
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">E-mail</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

### 1.3 Substituir inputs em `pages/ForgotPassword.tsx`

Mesma abordagem de Login.tsx — trocar `<input>` e `<label>` por `Input` e `Label` do shadcn.

### 1.4 Substituir inputs em `pages/RegisterRequest.tsx`

O formulário tem múltiplos steps com diferentes tipos de input. Substituir `<input>`, `<select>` e `<textarea>` por `Input`, `Select` e `Textarea`.

**Para o `<select>` (Select do Radix):**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

<Select value={region} onValueChange={setRegion}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione a região" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="americas">Américas</SelectItem>
    <SelectItem value="europa">Europa</SelectItem>
    {/* ... */}
  </SelectContent>
</Select>
```

### 1.5 Substituir `<textarea>` em `ui/ConfirmDialog.tsx`

```tsx
import { Textarea } from '@/src/components/ui/textarea';

// Substituir:
<textarea className="w-full min-h-[80px] border ..." />
// Por:
<Textarea className="min-h-[80px] resize-y" />
```

### 1.6 Substituir `<select>` em `ui/ReportDialog.tsx`

Usar o componente `Select` do shadcn para a lista de motivos de denúncia.

### 1.7 Substituir inputs em `pages/Postos.tsx`

Campo de busca e filtros de região.

### 1.8 Atualizar `ui/index.ts`

Após substituições, remover do barrel export o `Checkbox` antigo e apontar para o novo:
```ts
export { Checkbox } from './checkbox'; // shadcn (lowercase)
```

### Definição de pronto — Sprint 1

- [ ] `Input`, `Textarea`, `Select`, `Label`, `Checkbox` instalados via CLI
- [ ] Login.tsx usa `Input` + `Label` shadcn
- [ ] ForgotPassword.tsx usa `Input` + `Label` shadcn
- [ ] RegisterRequest.tsx usa `Input`, `Select`, `Textarea`, `Label` shadcn
- [ ] ReportDialog.tsx usa `Select` shadcn
- [ ] ConfirmDialog.tsx usa `Textarea` shadcn
- [ ] Postos.tsx usa `Input` shadcn
- [ ] `Checkbox.tsx` antigo removido
- [ ] `npm run lint` passa
- [ ] `npm test` passa (atenção aos testes de `ReportDialog.test.tsx`)

---

## Sprint 2 — Diálogos e alertas

**Duração estimada:** 4 dias  
**Risco:** Médio (lógica de foco e acessibilidade embutida no Radix)  
**Componentes shadcn:** `dialog`, `alert-dialog`

### Instalar os componentes

```bash
npx shadcn@latest add dialog alert-dialog
```

Isso instala `@radix-ui/react-dialog` e `@radix-ui/react-alert-dialog` como dependências.

### 2.1 Migrar `ui/ConfirmDialog.tsx` → `alert-dialog`

O `ConfirmDialog` atual implementa manualmente: backdrop, focus trap, escape key, aria roles. O `AlertDialog` do Radix fornece tudo isso nativamente.

**Mapeamento de props:**

| Prop atual | Equivalente shadcn |
|---|---|
| `isOpen` | `open` em `<AlertDialog>` |
| `title` | `<AlertDialogTitle>` |
| `message` | `<AlertDialogDescription>` |
| `confirmLabel` | texto em `<AlertDialogAction>` |
| `cancelLabel` | texto em `<AlertDialogCancel>` |
| `variant` | className em `<AlertDialogAction>` |
| `onConfirm` | `onClick` em `<AlertDialogAction>` |
| `onCancel` | `onClick` em `<AlertDialogCancel>` |

**Caso especial — `inputLabel` / `inputRequired`:**  
O `ConfirmDialog` tem suporte a um campo `<Textarea>` opcional. Este caso não tem equivalente direto no `AlertDialog` — usar `Dialog` em vez de `AlertDialog` quando `inputLabel` estiver presente.

**Nova implementação:**
```tsx
// src/components/ui/ConfirmDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Quando inputLabel está presente: usa Dialog (para ter campo de texto)
// Quando não: usa AlertDialog (mais acessível para confirmações simples)
```

**Vantagens pós-migração:**
- Remove `useFocusTrap` deste componente (Radix gerencia)
- Remove listener manual de `keydown` para Escape
- Remove `useRef` para o dialog container

### 2.2 Migrar `ui/ReportDialog.tsx` → `dialog`

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';

// Estrutura:
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Denunciar conteúdo</DialogTitle>
    </DialogHeader>
    {/* Select de motivo + Textarea de detalhes */}
    <DialogFooter>
      <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button variant="danger" onClick={handleSubmit}>Denunciar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2.3 Migrar logout dialog em `layout/Navbar.tsx`

O Navbar tem um diálogo de confirmação de logout implementado inline (`showLogoutDialog` state + div manual). Extrair para usar `AlertDialog`:

```tsx
<AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sair da conta</AlertDialogTitle>
      <AlertDialogDescription>Tem certeza que deseja sair?</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Remover de `Navbar.tsx`:**
- `logoutDialogRef`
- `useFocusTrap(logoutDialogRef, showLogoutDialog)`
- div manual do modal de logout

### 2.4 Migrar `ui/KeyboardShortcuts.tsx` → `dialog`

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Atalhos de teclado</DialogTitle>
    </DialogHeader>
    {/* Grade de atalhos com <kbd> */}
  </DialogContent>
</Dialog>
```

### Definição de pronto — Sprint 2

- [ ] `dialog` e `alert-dialog` instalados via CLI
- [ ] `ConfirmDialog.tsx` usa `AlertDialog` (sem inputLabel) / `Dialog` (com inputLabel)
- [ ] `ReportDialog.tsx` usa `Dialog`
- [ ] Logout dialog no Navbar usa `AlertDialog`
- [ ] `KeyboardShortcuts.tsx` usa `Dialog`
- [ ] `useFocusTrap` não é mais usado em nenhum dos componentes migrados
- [ ] Testes de `ReportDialog.test.tsx` passam (ajustar queries de DOM para o Radix Portal)
- [ ] `npm run lint` passa

---

## Sprint 3 — Navegação e busca

**Duração estimada:** 5 dias  
**Risco:** Médio-alto (Navbar é componente crítico e complexo)  
**Componentes shadcn:** `dropdown-menu`, `command`, `popover`

### Instalar os componentes

```bash
npx shadcn@latest add dropdown-menu command popover
```

Instala: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `cmdk`.

### 3.1 Migrar dropdowns do `layout/Navbar.tsx` → `dropdown-menu`

O Navbar tem dois dropdowns manuais:
1. **Dropdown de perfil** (avatar → Perfil, Configurações, Sair)
2. **Dropdown de Admin** (escudo → Membros, Moderação, Hub)

Ambos gerenciam estado manualmente (`dropdownOpen`, `adminDropdownOpen`) com refs e listener de click outside. O `DropdownMenu` do Radix elimina tudo isso.

**Antes (dropdown de perfil — padrão atual):**
```tsx
const [dropdownOpen, setDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// + useEffect com addEventListener('mousedown', handleClickOutside)
// + JSX manual com div posicionada absolutamente
```

**Depois:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button aria-label="Menu do usuário">
      <img src={profile.avatar_url} className="w-8 h-8 rounded-full" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-52">
    <DropdownMenuItem asChild>
      <Link to="/profile">Meu perfil</Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-danger focus:text-danger"
      onSelect={() => setShowLogoutDialog(true)}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sair
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Remover de `Navbar.tsx` após migração:**
- `dropdownOpen`, `setDropdownOpen`
- `adminDropdownOpen`, `setAdminDropdownOpen`
- `dropdownRef`, `adminDropdownRef`
- O `useEffect` de `handleClickOutside` (ou simplificá-lo para cuidar só da busca)

### 3.2 Migrar `layout/GlobalSearchDropdown.tsx` → `command`

O componente atual é um `<div>` com `role="listbox"` e navegação por teclado manual (setas + Enter). O `Command` (cmdk) fornece:
- Filtro nativo por texto
- Navegação por teclado
- Agrupamento por categorias
- ARIA embutido

**Estrutura nova:**
```tsx
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/src/components/ui/command';
import { Popover, PopoverContent, PopoverAnchor } from '@/src/components/ui/popover';

// No Navbar, envolver o campo de busca:
<Popover open={!!query && (results.users.length > 0 || results.posts.length > 0)}>
  <PopoverAnchor asChild>
    <Input
      ref={searchInputRef}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Buscar... (pressione /)"
    />
  </PopoverAnchor>
  <PopoverContent className="w-[500px] p-0" align="start">
    <Command shouldFilter={false}>
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        {results.users.length > 0 && (
          <CommandGroup heading="Membros">
            {results.users.map((user) => (
              <CommandItem key={user.id} onSelect={() => handleNavigate(user)}>
                {/* Avatar + nome */}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.posts.length > 0 && (
          <CommandGroup heading="Publicações">
            {results.posts.map((post) => (
              <CommandItem key={post.id} onSelect={() => handleNavigate(post)}>
                {/* Ícone + título/preview */}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

> **`shouldFilter={false}`** — A filtragem já é feita no hook `useGlobalSearch` via Supabase; o `Command` não deve re-filtrar no cliente.

### Definição de pronto — Sprint 3

- [ ] `dropdown-menu`, `command`, `popover` instalados via CLI
- [ ] Dropdown de perfil no Navbar usa `DropdownMenu`
- [ ] Dropdown de admin no Navbar usa `DropdownMenu`
- [ ] `GlobalSearchDropdown.tsx` refatorado usando `Command` + `Popover`
- [ ] Navegação por teclado na busca funciona (setas, Enter, Escape)
- [ ] Testes de `Navbar.test.tsx` passam (atualizar seletores de DOM)
- [ ] `npm run lint` passa

---

## Sprint 4 — Feedback e badges

**Duração estimada:** 3 dias  
**Risco:** Baixo  
**Componentes shadcn:** `badge`, `alert`, `skeleton`, `sonner`

### Instalar os componentes

```bash
npx shadcn@latest add badge alert skeleton sonner
```

### 4.1 Migrar `ui/StatusBadge.tsx` → `badge`

`StatusBadge` é um wrapper fino sobre `<span>`. O `Badge` do shadcn usa `cva` para variantes. A estratégia é manter o `StatusBadge` como um wrapper de conveniência sobre o `Badge` shadcn:

```tsx
// src/components/ui/StatusBadge.tsx (novo)
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

const variantMap = {
  success: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  error:   'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20',
  info:    'bg-info/10 text-info border-info/20 hover:bg-info/20',
  neutral: 'bg-slate/10 text-slate border-slate/20 hover:bg-slate/20',
};

export function StatusBadge({ status, className, children, ...props }) {
  return (
    <Badge
      variant="outline"
      className={cn(variantMap[status], className)}
      role="status"
      {...props}
    >
      {children}
    </Badge>
  );
}
```

Isso mantém retrocompatibilidade total — todos os consumidores de `StatusBadge` continuam funcionando sem alteração.

### 4.2 Migrar `ui/Alert.tsx` → `alert`

O `Alert` atual é muito similar ao shadcn. Manter como wrapper fino para preservar as props `variant` com nomes em português:

```tsx
// src/components/ui/Alert.tsx (novo)
import {
  Alert as ShadcnAlert,
  AlertDescription,
  AlertTitle,
} from '@/src/components/ui/alert';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const iconMap = { error: AlertCircle, success: CheckCircle, warning: AlertTriangle, info: Info };
const variantMap = { error: 'destructive', success: 'default', warning: 'default', info: 'default' };

export function Alert({ variant = 'error', title, children, ...props }) {
  const Icon = iconMap[variant];
  return (
    <ShadcnAlert variant={variantMap[variant]} {...props}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </ShadcnAlert>
  );
}
```

### 4.3 Migrar `ui/Skeleton.tsx` → `skeleton`

O `Skeleton` atual é idêntico ao do shadcn (um `<div>` com `animate-pulse`). Substituição direta:

```tsx
// Deletar src/components/ui/Skeleton.tsx
// Atualizar ui/index.ts:
export { Skeleton } from './skeleton'; // shadcn
```

### 4.4 Migrar `ui/Toast.tsx` → `sonner`

O Sonner é a solução recomendada pelo shadcn para toasts. É mais simples e sem Context:

**Instalação:**
```bash
npx shadcn@latest add sonner
```

**No `src/App.tsx` (ou root):**
```tsx
import { Toaster } from '@/src/components/ui/sonner';

// Dentro do JSX raiz:
<Toaster position="bottom-right" richColors />
```

**Substituição do `useToast`:**
```tsx
// Antes:
import { useToast } from '@/src/components/ui/Toast';
const { addToast } = useToast();
addToast('Salvo com sucesso', 'success');

// Depois:
import { toast } from 'sonner';
toast.success('Salvo com sucesso');
```

**Equivalência de tipos:**
| `addToast(msg, type)` atual | Sonner equivalente |
|---|---|
| `addToast(msg, 'success')` | `toast.success(msg)` |
| `addToast(msg, 'error')` | `toast.error(msg)` |
| `addToast(msg, 'info')` | `toast.info(msg)` |
| `addToast(msg, 'warning')` | `toast.warning(msg)` |

**Busca global para migração:**
```
# Arquivos que usam useToast / addToast:
grep -r "useToast\|addToast" src/ --include="*.tsx" -l
```

### Definição de pronto — Sprint 4

- [ ] `badge`, `alert`, `skeleton`, `sonner` instalados via CLI
- [ ] `StatusBadge.tsx` é wrapper fino sobre `Badge` shadcn
- [ ] `Alert.tsx` é wrapper fino sobre `Alert` shadcn
- [ ] `Skeleton.tsx` antigo removido, `skeleton` shadcn em uso
- [ ] `Toast.tsx` e `ToastProvider` removidos
- [ ] `Toaster` (Sonner) adicionado no root da app
- [ ] Todos os `addToast(...)` substituídos por `toast.*(...)`
- [ ] `npm run lint` passa
- [ ] `npm test` passa

---

## Sprint 5 — Tabelas, tabs e avatar

**Duração estimada:** 5 dias  
**Risco:** Médio  
**Componentes shadcn:** `table`, `tabs`, `tooltip`, `avatar`, `separator`

### Instalar os componentes

```bash
npx shadcn@latest add table tabs tooltip avatar separator
```

Instala: `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-avatar`, `@radix-ui/react-separator`.

### 5.1 Migrar tabelas em `pages/AdminMembers.tsx` → `table`

O componente atual usa `<table>` com classes Tailwind avulsas. A migração adiciona tipagem e consistência:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>E-mail</TableHead>
      <TableHead>Posto</TableHead>
      <TableHead>Solicitado em</TableHead>
      <TableHead className="text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {members.map((member) => (
      <TableRow key={member.id}>
        <TableCell className="font-medium">{member.name}</TableCell>
        <TableCell>{member.email}</TableCell>
        <TableCell>{member.posto}</TableCell>
        <TableCell>{formatDate(member.created_at)}</TableCell>
        <TableCell className="text-right">
          <Button size="sm" onClick={() => handleApprove(member.id)}>Aprovar</Button>
          <Button size="sm" variant="danger" onClick={() => handleReject(member.id)}>Rejeitar</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 5.2 Migrar tabelas em `pages/AdminModeration.tsx` → `table`

Mesma abordagem. Adicionar `StatusBadge` na coluna de status dos reports.

### 5.3 Extrair tabs de `pages/Profile.tsx` → `tabs`

O Profile tem seções que funcionam como abas (publicações, posts salvos, sobre). Extrair para `Tabs`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

<Tabs defaultValue="posts">
  <TabsList>
    <TabsTrigger value="posts">Publicações</TabsTrigger>
    <TabsTrigger value="saved">Posts salvos</TabsTrigger>
    <TabsTrigger value="about">Sobre</TabsTrigger>
  </TabsList>
  <TabsContent value="posts">
    {/* Lista de posts do usuário */}
  </TabsContent>
  <TabsContent value="saved">
    {/* Posts salvos */}
  </TabsContent>
  <TabsContent value="about">
    {/* Informações do perfil */}
  </TabsContent>
</Tabs>
```

### 5.4 Extrair tabs de `pages/PostoDetails.tsx` → `tabs`

PostoDetails tem seções para informações gerais, avaliações e relatórios de campo. Mesma abordagem.

### 5.5 Adicionar `tooltip` em botões de ação

Botões de ícone sem texto (reações, salvar post, etc.) devem ter `Tooltip`:

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';

// Envolver a app com TooltipProvider (src/App.tsx)
<TooltipProvider>
  {/* app */}
</TooltipProvider>

// Uso:
<Tooltip>
  <TooltipTrigger asChild>
    <button aria-label="Salvar publicação">
      <Bookmark className="w-5 h-5" />
    </button>
  </TooltipTrigger>
  <TooltipContent>Salvar publicação</TooltipContent>
</Tooltip>
```

### 5.6 Compor `ui/AvatarUpload.tsx` sobre `avatar`

O `AvatarUpload` é complexo (drag-drop, resize de canvas, preview). Usar o componente `Avatar` do shadcn apenas para a exibição, mantendo a lógica customizada de upload:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';

// Dentro de AvatarUpload, substituir o <img> de preview por:
<Avatar className="w-24 h-24">
  <AvatarImage src={previewUrl || profile.avatar_url} alt={profile.name} />
  <AvatarFallback className="bg-navy text-white text-xl">
    {profile.name.slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

Usar `Avatar` também em `PostCard`, `LeftSidebar`, `MemberSuggestionsCard` onde avatars são exibidos.

### 5.7 Adicionar `separator` onde há `<hr>` ou `divide-y`

```tsx
import { Separator } from '@/src/components/ui/separator';

// Substituir divisores visuais entre seções
<Separator className="my-4" />
```

### Definição de pronto — Sprint 5

- [ ] `table`, `tabs`, `tooltip`, `avatar`, `separator` instalados via CLI
- [ ] `AdminMembers.tsx` usa componentes `Table` shadcn
- [ ] `AdminModeration.tsx` usa componentes `Table` shadcn
- [ ] `Profile.tsx` usa `Tabs` para seções
- [ ] `PostoDetails.tsx` usa `Tabs` para seções
- [ ] `TooltipProvider` adicionado no root em `App.tsx`
- [ ] Botões de ícone envolvidos em `Tooltip`
- [ ] `AvatarUpload.tsx` usa `Avatar` do shadcn para o preview
- [ ] `npm run lint` passa
- [ ] `npm test` passa

---

## Sprint 6 — Cards e navegação estrutural

**Duração estimada:** 3 dias  
**Risco:** Baixo  
**Componentes shadcn:** `card`, `breadcrumb`, `button`, `scroll-area`

### Instalar os componentes

```bash
npx shadcn@latest add card breadcrumb button scroll-area
```

### 6.1 Migrar `ui/Button.tsx` → `button`

O `Button` atual tem variantes `primary | secondary | danger | ghost`. O shadcn usa `default | destructive | outline | secondary | ghost | link`. Criar um mapeamento:

```tsx
// src/components/ui/Button.tsx (wrapper de compatibilidade)
import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps } from '@/src/components/ui/button';

type LegacyVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variantMap: Record<LegacyVariant, ShadcnButtonProps['variant']> = {
  primary:   'default',
  secondary: 'outline',
  danger:    'destructive',
  ghost:     'ghost',
};

export interface ButtonProps extends Omit<ShadcnButtonProps, 'variant'> {
  variant?: LegacyVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', isLoading, fullWidth, className, children, ...props }: ButtonProps) {
  return (
    <ShadcnButton
      variant={variantMap[variant]}
      className={cn(fullWidth && 'w-full', className)}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />{children}</>
      ) : children}
    </ShadcnButton>
  );
}
```

Isso preserva retrocompatibilidade com todos os consumidores enquanto a migração progressiva ocorre. Após todos os consumidores usarem diretamente o `Button` shadcn, o wrapper pode ser removido.

### 6.2 Migrar `ui/Card.tsx` → `card`

Mesma estratégia de wrapper para variantes customizadas:

```tsx
// src/components/ui/Card.tsx (wrapper)
import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/src/components/ui/card';

// Re-exportar as subpartes para quem quiser usar diretamente
export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter };

// Wrapper com variantes legadas
export function Card({ variant = 'default', padding = 'md', className, children, ...props }) {
  const variants = {
    default:  'border-border-gray',
    elevated: 'border-border-gray shadow-sm',
    featured: 'bg-navy text-white shadow-sm',
    outlined: 'bg-ice border-border-gray',
  };
  return (
    <ShadcnCard className={cn(variants[variant], paddingMap[padding], className)} {...props}>
      {children}
    </ShadcnCard>
  );
}
```

### 6.3 Migrar `ui/Breadcrumb.tsx` → `breadcrumb`

Substituição direta:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/src/components/ui/breadcrumb';
```

### 6.4 Adicionar `scroll-area` onde necessário

Em listas longas (notificações, mensagens, resultados de busca), usar `ScrollArea` para scroll customizado e consistente entre plataformas:

```tsx
import { ScrollArea } from '@/src/components/ui/scroll-area';

// em Messages.tsx (lista de conversas):
<ScrollArea className="h-[calc(100vh-4rem)]">
  {conversations.map(c => <ConversationItem key={c.id} {...c} />)}
</ScrollArea>
```

### Definição de pronto — Sprint 6

- [ ] `card`, `breadcrumb`, `button`, `scroll-area` instalados via CLI
- [ ] `Button.tsx` é wrapper compatível sobre `button` shadcn
- [ ] `Card.tsx` é wrapper compatível sobre `card` shadcn
- [ ] `Breadcrumb.tsx` usa componente shadcn
- [ ] `ScrollArea` em uso nos containers de lista longa
- [ ] `npm run lint` passa
- [ ] `npm test` passa (173 testes)

---

## O que não migra

| Componente | Motivo | Ação |
|---|---|---|
| `PostEditor.tsx` | TipTap — editor próprio sem equivalente shadcn | Manter; aplicar classes shadcn ao toolbar buttons |
| `brand/AsofLogo.tsx` | SVG institucional | Manter sem alteração |
| `brand/AuthShell.tsx` | Layout customizado com animações CSS `auth-reveal` | Manter; pode usar `Card` shadcn internamente |
| `brand/BrandLockup.tsx` | Identidade visual | Manter sem alteração |
| `Tour.tsx` | `react-joyride` — terceiro sem equivalente shadcn | Manter |
| `ErrorBoundary.tsx` | Infraestrutura de React | Manter |
| `ReactionButtons.tsx` | Lógica de reações com `motion` | Manter; apenas styling |
| `feed/PostCard.tsx` | Componente de negócio complexo | Refatorar gradualmente para usar Card/Badge/Button shadcn internamente |
| `ui/LoadingUI.tsx` | Composite de Skeleton + spinners | Adaptar para usar `Skeleton` shadcn |
| `ui/OfflineIndicator.tsx` | Banner simples sem equivalente | Manter |
| `ui/PageTitle.tsx` | Heading polimórfico simples | Manter |
| `layout/PageContainer.tsx` | Layout helper | Manter |

---

## Variáveis CSS — mapeamento completo

Referência para garantir que os tokens shadcn produzam o visual ASOF correto.

| Token shadcn | Token ASOF | Valor light | Valor dark |
|---|---|---|---|
| `--background` | `--app-white` | `#ffffff` | `#111827` |
| `--foreground` | `--app-navy` | `#0D2A4A` | `#E7EDF4` |
| `--primary` | `--app-navy` | `#0D2A4A` | `#E7EDF4` |
| `--primary-foreground` | `--app-white-fixed` | `#ffffff` | `#ffffff` |
| `--secondary` | `--app-ice` | `#E7EDF4` | `#0F172A` |
| `--secondary-foreground` | `--app-navy` | `#0D2A4A` | `#E7EDF4` |
| `--muted` | `--app-ice` | `#E7EDF4` | `#0F172A` |
| `--muted-foreground` | `--app-slate` | `#374151` | `#82B4D6` |
| `--accent` | `--app-sky` | `#5A8FBF` | `#0D2A4A` |
| `--destructive` | `--app-danger` | `#DC2626` | `#ef4444` |
| `--border` | `--app-border-gray` | `#D1D5DB` | `#1e293b` |
| `--input` | `--app-border-gray` | `#D1D5DB` | `#1e293b` |
| `--ring` | `--app-navy` | `#0D2A4A` | `#82B4D6` |
| `--radius` | — | `0rem` | `0rem` |

---

## Critérios de definição de pronto

Aplicáveis a **todos os sprints**:

### Qualidade de código
- [ ] Nenhum `useRef` para gerenciar estado de dropdown ou dialog (substituído por Radix)
- [ ] Nenhum listener manual de `mousedown` para fechar menus (substituído por Radix)
- [ ] Nenhum `useFocusTrap` em diálogos migrados (substituído por Radix)
- [ ] `npm run lint` (tsc --noEmit) sem erros

### Testes
- [ ] `npm test` passa com 173 testes (ou mais, se novos testes foram adicionados)
- [ ] Testes de componentes que usam portais do Radix (Dialog, DropdownMenu) usam `within(document.body)` para encontrar elementos no portal

### Acessibilidade
- [ ] Todos os botões de ícone têm `aria-label`
- [ ] Diálogos têm `aria-labelledby` e `aria-describedby` (automático via Radix)
- [ ] Toasts são anunciados por leitores de tela (automático via Sonner)
- [ ] Dark mode funciona em todos os componentes migrados

### Visual
- [ ] Nenhuma regressão visual perceptível em comparação com o estado anterior
- [ ] `--radius: 0rem` mantém o estilo quadrado institucional
- [ ] Cores mapeadas para os tokens `--app-*` (não valores hardcoded)

---

## Resumo por sprint

| Sprint | Componentes shadcn instalados | Arquivos afetados | Dias estimados |
|---|---|---|---|
| 0 | — (configuração) | `components.json`, `src/index.css` | 2 |
| 1 | `input` `textarea` `select` `label` `checkbox` | 6 arquivos | 4 |
| 2 | `dialog` `alert-dialog` | 4 arquivos | 4 |
| 3 | `dropdown-menu` `command` `popover` | 2 arquivos | 5 |
| 4 | `badge` `alert` `skeleton` `sonner` | ~15 arquivos (toast) | 3 |
| 5 | `table` `tabs` `tooltip` `avatar` `separator` | 5 arquivos | 5 |
| 6 | `card` `breadcrumb` `button` `scroll-area` | ~20 arquivos | 3 |
| **Total** | **21 componentes shadcn** | **~50 arquivos** | **~26 dias** |
