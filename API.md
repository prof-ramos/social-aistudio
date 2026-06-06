# Documentação da API - Social-ASOF

A aplicação Social-ASOF utiliza uma arquitetura híbrida de API:
1. **API REST (Node.js/Express):** Usada para funcionalidades que não podem ser expostas no lado do cliente com segurança (como envio de e-mails via SMTP).
2. **API de Dados e Tempo Real (Firebase SDK):** Interação direta com o Firestore para gerenciar usuários, postagens, postos e denúncias, protegida por Regras de Segurança do Firebase (`firestore.rules`).

---

## 1. API REST (Endpoints Públicos)

O sistema Express.js (`server.ts`) expõe as seguintes rotas HTTP.

### 1.1 `POST /api/admin/notify-request`

**Descrição:**  
Endpoint utilizado para notificar os administradores (via disparo de e-mail SMTP) quando um novo associado preenche o formulário para ingressar e ter status de acesso aprovado (Approval Request) na plataforma.

**Restrições e Autenticação:**
* **Publicamente Acessível:** Não exige autenticação de tokens, pois atende a visitantes não registrados/não aprovados da página inicial.
* **Limitação de Taxa (Rate Limiting):** Nenhuma limitação nativa em vigor. O envio abusivo pode acabar consumindo a cota de envio do provedor SMTP.

**Formato de Solicitação (Request):**
* Content-Type: `application/json`

```json
{
  "name": "João Piloto",
  "email": "joao.piloto@dominio.com",
  "matricula": "123456"
}
```

**Formato de Resposta (Response):**
* Content-Type: `application/json`

* **Sucesso (Status 200 OK):**
```json
{
  "success": true
}
```

* **Erro (Status 500 Internal Server Error):**
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

## 2. API Local e Modelos de Banco de Dados (Firebase)

Por utilizar o modelo de arquitetura *Serverless* com Data-as-an-API, grande parte da plataforma interage diretamente com o banco de dados via Firebase Client SDK. Essas operações são isoladas dentro dos "Serviços" (ex. `userService`, `postService`) na pasta `/src/services/` e totalmente protegidas por regras de segurança no Firestore (`firestore.rules`).

### Entidades e Permissões de Acesso

| Coleção Firestore | Serviço Responsável | Interface (Types) | Diretrizes e Regras de Segurança |
| :--- | :--- | :--- | :--- |
| **`users`** | `userService`, `authService` | `UserProfile`, `AuthUser` | Editável apenas pelo próprio usuário ou por um `ADMIN`. Leitura pública para usuários autenticados. |
| **`posts`** | `postService` | `Post` | Podem ser criados por usuários logados (não reprovados/pendentes). Edição e exclusão permitidas apenas ao autor ou `ADMIN`. |
| **`posts/{id}/comments`** | `postService` | `PostComment` | Subcoleção aninhada vinculada ao post. Leitura/Escrita restritas a usuários autenticados. |
| **`postos`** | `postoService` | `STATIC_POSTOS` | Acesso de leitura/escrita protegido via stream em canais da plataforma. |
| **`memberRequests`** | `memberRequestService`, `adminService` | `{ name, email, role, status }` | Escrita livre (requests). Leitura, atualização ou exclusão (`status`) controladas de forma exclusiva pela regra de `ADMIN`. |
| **`reports`** | `reportService`, `adminService` | `Report` | Criação livre pelos usuários ao flagrar conteúdo inadequado. Apenas `ADMIN` consegue resolver/acompanhar ou aprovar denúncias. |
| **`notifications`** | `notificationService` | `{ userId, message, read }` | Rigidez restrita: A leitura e a atualização das notificações são vinculadas rigidamente ao `userId` de destino. |

**Exemplo de Consumo no Cliente (Tempo Real):**
```typescript
import { postService } from '../services/postService';

// Ouvir ativamente e em tempo real novas publicações feitas
const unsubscribe = postService.subscribeToFeed((posts) => {
   console.log("Recebidos novos posts na timeline principal:", posts);
});

// Limpar escuta ao desmontar componente
unsubscribe();
```

---

## 3. Requisitos e Considerações Finais

1. **Variáveis de Ambiente (SMTP):** O endpoint `/api/admin/notify-request` requer explicitamente as chaves `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASS` lançadas nas variáveis de ambiente. A ausência causará quebras no transporte e timeout na resposta das solicitações de acesso.
2. **Separação de Lógica UI/Service:** Evite chamadas diretas ao banco do Firebase dentro nos componentes de interface `.tsx`. Empregue componentes independentes com os Hooks (`src/hooks/useFeed.ts`) que delegam as funções complexas para os módulos de serviço e respeitam o MVC do front-end.
