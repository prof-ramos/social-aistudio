# Documentação da API — Social-ASOF

A aplicação Social-ASOF utiliza uma arquitetura híbrida de API:

1. **API REST (Express 5):** Usada para funcionalidades que não podem ser expostas no lado do cliente com segurança (envio de e-mails via SMTP).
2. **API de Dados e Tempo Real (Supabase SDK):** Interação direta com o PostgreSQL via Supabase JS SDK para gerenciar usuários, postagens, postos, chat e denúncias, protegida por políticas de Row Level Security (RLS).

---

## 1. API REST (Endpoints Públicos)

O servidor Express (`server.ts`) expõe as seguintes rotas HTTP.

### 1.1 `POST /api/admin/notify-request`

**Descrição:**
Endpoint utilizado para notificar os administradores (via disparo de e-mail SMTP) quando um novo associado preenche o formulário de solicitação de acesso à plataforma.

**Restrições e Autenticação:**
- **Publicamente Acessível:** Não exige autenticação de tokens, pois atende a visitantes não registrados.
- **Limitação de Taxa (Rate Limiting):** Implementada via `express-rate-limit` — máximo de 5 requisições por IP a cada 15 minutos.

**Formato de Solicitação (Request):**
- Content-Type: `application/json`

```json
{
  "name": "João Piloto",
  "email": "joao.piloto@dominio.com",
  "matricula": "123456"
}
```

**Formato de Resposta (Response):**
- Content-Type: `application/json`

- **Sucesso (Status 200 OK):**
```json
{
  "success": true
}
```

- **Erro (Status 500 Internal Server Error):**
```json
{
  "error": "Erro ao enviar email"
}
```

**Exemplo Prático (JavaScript/TypeScript Fetch):**
```javascript
async function sendAccessRequest() {
  try {
    const res = await fetch('/api/admin/notify-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Silva',
        email: 'carlos.silva@exemplo.com.br',
        matricula: '123456'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    console.log("Notificação enviada aos administradores!");
  } catch (error) {
    console.error("Falha ao comunicar com o servidor.", error);
  }
}
```

---

## 2. API de Dados (Supabase)

A maior parte da plataforma interage diretamente com o banco de dados PostgreSQL via Supabase JS SDK. Essas operações são isoladas dentro dos serviços em `/src/services/` e protegidas por políticas RLS no banco de dados.

### Entidades e Permissões de Acesso

| Tabela | Serviço Responsável | Interface (Types) | Diretrizes de Acesso |
|:---|:---|:---|:---|
| **`users`** | `userService`, `authService` | `UserProfile`, `AuthUser` | Editável apenas pelo próprio usuário ou ADMIN. Leitura para usuários autenticados. |
| **`posts`** | `postService`, `postRepository` | `Post` | Criação por usuários logados (role != PENDENTE). Edição/exclusão apenas pelo autor ou ADMIN. |
| **`post_comments`** | `postService` | `PostComment` | Vinculada ao post pai. Leitura/escrita para usuários autenticados. |
| **`postos`** | `postoService` | `Posto` | Leitura pública autenticada. Avaliações via `posto_reviews`. |
| **`posto_reviews`** | `postoService` | `PostoReview` | Uma avaliação por usuário por posto. |
| **`chat_sessions`** | `chatService` | `ChatSession` | Participantes da sessão têm acesso. |
| **`chat_messages`** | `chatService` | `ChatMessage` | Apenas participantes da sessão. |
| **`member_requests`** | `memberRequestService` | — | Escrita livre (solicitação). Leitura/atualização apenas por ADMIN. |
| **`notifications`** | `notificationService`, `notificationOrchestrator` | `Notification` | Leitura e atualização vinculadas ao `userId` de destino. |
| **`reports`** | `reportService` | `Report` | Criação por qualquer usuário autenticado. Resolução apenas por ADMIN. |

### Operações Comuns

#### Autenticação (`authService`)
```typescript
import { authService } from '../services/authService';

// Login
const { user, session } = await authService.signIn('email@exemplo.com', 'senha');

// Logout
await authService.signOut();

// Observer de estado da sessão
const unsubscribe = authService.onAuthStateChanged((session) => {
  console.log('Sessão alterada:', session);
});
```

#### Feed em Tempo Real (`postService`)
```typescript
import { postService } from '../services/postService';

// Inscrever-se no feed ao vivo
const unsubscribe = postService.subscribeToFeed((posts) => {
  console.log("Novos posts na timeline:", posts);
}, { category: 'GERAL' });

// Limpar escuta ao desmontar componente
unsubscribe();
```

#### Chat em Tempo Real (`chatService`)
```typescript
import { chatService } from '../services/chatService';

const unsubscribe = chatService.subscribeToMessages(sessionId, (messages) => {
  console.log("Novas mensagens:", messages);
});
```

#### Notificações (`notificationService`)
```typescript
import { notificationService } from '../services/notificationService';

const { data: notifications, count: unreadCount } = 
  await notificationService.getNotifications(userId);

await notificationService.markAsRead(notificationId);
```

### RLS (Row Level Security)

Todas as tabelas com dados de usuário possuem políticas RLS implementadas nas migrations SQL. As políticas garantem que:

- Usuários só veem dados que têm permissão para ver
- Operações de escrita verificam propriedade (authorId, userId) ou role ADMIN
- O `service_role_key` (usado apenas em scripts server-side) bypassa RLS

---

## 3. Requisitos e Considerações Finais

1. **Variáveis de Ambiente:** O endpoint `/api/admin/notify-request` requer `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `ADMIN_EMAIL`. O cliente Supabase requer `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Todas em `.env.local`.

2. **Separação de Camadas:** Evite chamadas diretas ao Supabase SDK dentro de componentes `.tsx`. Use hooks (`src/hooks/`) que delegam para os serviços (`src/services/`).

3. **Realtime:** Assinaturas Realtime devem ser limpas no unmount do componente para evitar vazamento de memória e conexões órfãs.

4. **Migrações:** Alterações no esquema do banco são feitas via migrations SQL em `supabase/migrations/` e aplicadas com `npx supabase db push`.
