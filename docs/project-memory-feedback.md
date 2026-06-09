# Memórias e Aprendizados do Projeto (Project Feedback)

Este documento registra as armadilhas, erros e resoluções encontradas durante os ciclos de desenvolvimento, com o intuito de evitar repetições em sessões futuras.

## 1. Segurança e Exposição de Segredos
**Erro:** Scripts de desenvolvimento (como `setup-admin.ts` e `test-login.ts`) continham credenciais expostas no código, e relatórios crus do Lighthouse (`.json` e `.html`) foram adicionados acidentalmente ao Git, expondo a estrutura do site.
**Resolução:** 
- Nunca comitar chaves, `service_role_key` ou relatórios locais.
- Adicionadas regras estritas no `.gitignore` para ignorar pastas de artefatos (ex: `lighthouse-reports/` e `.lighthouseci/`).
- Uso exclusivo do `.env.local` para gestão de credenciais locais de teste.

## 2. Supabase RLS (Row Level Security) Recursivo
**Erro:** Criação de políticas RLS que referenciam a própria tabela para checagem de permissão (ex: políticas na tabela `chat_sessions` e `chat_participants` fazendo JOIN nas mesmas tabelas para verificar afiliação). Isso gera o clássico erro do Postgres: `infinite recursion detected in policy`.
**Resolução:**
- Não usar `SELECT` direto na mesma tabela dentro da policy.
- Se uma lógica de acesso for complexa, usar *Views* (ex: `users_public`) ou funções auxiliares com `SECURITY DEFINER` (que ignoram temporariamente o RLS para a checagem lógica).

## 3. Condições de Corrida (Race Conditions / TOCTOU)
**Erro:** O fluxo de criação de conversas diretas na camada frontend/TypeScript executava uma checagem (existe chat?) e depois uma inserção (cria chat!). Requisições simultâneas criavam salas duplicadas.
**Resolução:** 
- Lógicas atômicas e críticas no banco devem ser encapsuladas em **RPCs (Remote Procedure Calls)** no Supabase (`get_or_create_chat`), garantindo que o PostgreSQL lide com os *locks* transacionais e evite duplicações.

## 4. Testes React com Side Effects Desprotegidos
**Erro:** O gancho de pré-commit (`husky`) falhou no `npm run test` bloqueando commits porque o teste `AsofLogo.test.tsx` e `Navbar.test.tsx` atualizavam o estado do React fora de um bloco `act(...)`.
**Resolução:**
- Sempre que houver *fetching* ou timeouts acionados pelo ciclo de vida do React dentro de um teste, é imperativo usar utilitários como `waitFor` do Testing Library ou envolver os disparos em `act()`.

## 5. Tipagem TypeScript: Backend x Frontend
**Erro:** Atualização do *schema* de banco de dados (ex: `created_at` para `createdAt`) não refletida simultaneamente nas interfaces do frontend (`src/types/index.ts`). Isso fez o `npm run lint` falhar por incompatibilidade de conversão em hooks.
**Resolução:**
- Para cada migração SQL que altere nomes de colunas, verificar obrigatoriamente a interface correspondente no diretório `/types`.

## 6. Ferramentas GitHub MCP / Autenticação
**Erro:** O uso automático de ferramentas como `create_pull_request` pode falhar por `401 Bad credentials` se os escopos do token não cobrirem repositórios específicos.
**Resolução:**
- Fazer os commits e *pushes* localmente no terminal (`git push origin <branch>`), garantindo os artefatos no remoto, e recorrer à interface web em caso de recusa da API.
