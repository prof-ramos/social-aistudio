# Guia do Desenvolvedor: Social-ASOF

Bem-vindo ao Guia do Desenvolvedor do projeto Social-ASOF. Este documento fornece todas as informações necessárias para configurar, entender e desenvolver ativamente a plataforma.

## 1. Instruções de Configuração

### Pré-requisitos
- Node.js (versão 18+)
- npm ou yarn
- Conta e projeto no Firebase (com Firestore e Authentication ativados)

### Passo a Passo

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente baseadas no aquivo `.env.example`.
   Crie um arquivo `.env` na raiz do projeto com as chaves necessárias (ex: credenciais do Firebase).

3. Variáveis Firebase Cliente:
   As chaves do frontend normalmente começam com `VITE_` e são configuradas no `.env`, garantindo conexão correta com seu projeto Firebase correspondente.

4. Inicie o Servidor de Desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação subirá localmente servida pelo Express no modo middleware do Vite. (Acesso padrão via porta 3000).

## 2. Visão Geral da Estrutura do Projeto

O projeto segue uma arquitetura full-stack (React/Vite no frontend e Express no backend), com foco em organização lógica e componentização flexível.

- **`/src`**: Código fonte principal da aplicação.
  - **`/components`**: Componentes reutilizáveis de interface (ex: Navbar, Layout, feed/ReactionButtons).
  - **`/pages`**: Componentes de rota principal contendo a lógica e páginas inteiras (Feed, Login, Notifications, Messages, etc.).
  - **`/services`**: Lógica de comunicação de dados, Firebase, Firestore (postService, chatService, notificationService, etc.). A interface primária com o banco.
  - **`/hooks`**: Hooks do React customizados para acesso a dados, monitoramento de estado e assinaturas em tempo real do Firebase.
  - **`/types`**: Tipos globais e interfaces TypeScript (Post, UserProfile, ChatMessage, etc.).
  - **`/lib`**: Scripts de utilidade base para a aplicação, contêm configuração primária (como a inicialização do Firebase `firebase.ts`).
- **`/server.ts`**: Ponto de entrada do backend. Ele instancia o servidor Express e atende as rotas `/api/*` e o Vite em modo desenvolvimento. 
- **`tailwind.css`** (ou `index.css`): Estilos globais configurados com definições do novo padrão Tailwind CSS v4.
- **`/package.json`**: Definições das dependências e scripts de automação.

## 3. Fluxo de Trabalho de Desenvolvimento

- **Integrações de Componentes:** Mantenha os componentes em `/components` pequenos e sem lógica intrínseca pesada (componentes "burros"), passando estado pelas `props`. Lógica complexa é delegada às `/pages` ou extraída em *custom hooks*.
- **Estruturação de Dados com Firebase:** O modelo de dados baseia-se em documentos sem esquema rígido, porém fortemente tipado via TypeScript (`/types/index.ts`). Qualquer adição de novas coleções deve ser acompanhada de uma tipagem explícita nova e manipulação centralizada dentro de de sua respectiva classe/objeto na pasta `/services`.
- **Evolução do Servidor (Express):** Para lidar com dados muito sensíveis, modifique as rotas contidas no arquivo `server.ts`. Nele devem residir APIs para ações corporativas (envio de emails corporativos, por exemplo) e chaves sensíveis que **não podem** ser públicas. O frontend apenas invoca o Express (`/api/nova-action`).
- **Commits e Build:** O contêiner de CI constrói o código com `npm run build`. É importante validar o Build e a checagem rigorosa de sintaxe TypeScript (`npm run lint`) antes da finalização.

## 4. Abordagem de Teste

- **Testes Manuais e de UI:** A principal frente para validações em tempo de desenvolvimento. 
  - Teste as mudanças de design focando em layouts mobile e desktop (usando utilitários `sm:`, `md:`).  
  - Para novas rotas ou componentes, utilize as ferramentas de emulação do Vite para checar responsividade e comportamentos visuais de imediato.
- **Checagem de Qualidade TypeScript:** Assegure-se de sempre corrigir erros detectados via compilador de TypeScript (`npm run lint`), focando no design e consistência entre as passagens de atributos.
- **Teste das Assinaturas em Tempo Real (*Real-time*):** Serviços que invocam `onSnapshot` (como Chats, Feed e Notificações) devem ser validados simulando transações simultâneas ou alterações diretas via console do Firebase Firestore, garantindo que o callback atualiza propriamente as telas de *React* associadas aos *Hooks*.

## 5. Etapas Comuns de Solução de Problemas

**5.1 Erros de tipagem ou exportação não encontrada**
- Verifique se a variável/interface se provém do diretório padrão `/types/index.ts`. No Vite com esbuild certifique-se de que exportações apenas de tipagens sejam devidamente mapeadas caso precise de distinção severa, embora o compilador base deva lidar adequadamente.

**5.2 O sistema não reflete dados salvos em tempo real ou UI trava**
- Validação no `onSnapshot`. É comum esquecer de executar o código de retorno para descartar os ouvintes `unsubscribe()`. Certifique-se de que cada hook tenha seu devido tratamento de liberação de memória em `useEffect` (ex: `return () => unsub()`).

**5.3 Tailwind classes não aplicadas / Stylesheet quebrado**
- Com Tailwind v4 configurado como plugin do Vite e importação modular, verifique suas variações via `@theme`. Reinicie o servidor se um plugin severo ou diretiva foi alterada e os estilos pararem de sincronizar.

**5.4 Servidor travando no início "Starting Dev Server..." indefinidamente**  
- O Express trava na inicialização em chaves sensíveis nulas ou SDKs que dão falhas antes do listen (Como Stripe, Firebase Admin mal inicializado). Sempre passe validações ou atrasos na validação para que a verificação seja feita _sob demanda_.

**5.5 Erros de CORS ou acesso negado no Firebase**
- Acesse as `Rules` (regras na nuvem) do banco Firestore. O projeto exige configuração que projeta leituras seguras. Muitas consultas com `where` exigem a criação de indexação nativa. Quando faltante, o console retornará um link direto de resolução da Google; clique, conecte e aguarde o índice engatar.
