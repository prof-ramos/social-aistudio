# Ready-to: Checklist de Deploy

> Gerado em: 2026-06-12
> Projeto: Social-ASOF
> Branch: `main`
> Stack: React 19 + Supabase + Express 5 + Vite

---

## ✅ Verificações ok

- **TypeScript**: compila sem erros com strict mode ativo
- **Testes**: 34 arquivos, 173/173 passando
- **Build**: Vite 6 + esbuild — sucesso
- **Git**: `main` limpa, synced com `origin/main`
- **CI**: GitHub Actions presente (`ci.yml` com tsc + test + build)
- **Lighthouse CI**: workflow presente
- **Husky**: ativo (lint-staged com vitest + tsc no pre-commit)
- **Strict mode**: ativado
- **.env.example**: completo, documenta 11 variáveis (Supabase, SMTP, Admin, Seed)
- **.gitignore**: bem configurado
- **Design system**: maduro — tokens, componentes `ui/`, acessibilidade WCAG AA
- **Database**: migrations SQL, RLS policies, Supabase Realtime
- **Supabase**: configurado e funcional
- **Servidor**: rodando via PM2 com auto-restart (systemd) em `http://100.103.209.87:3000`
- **Zero `as any`** em produção
- **Zero TODOs/FIXMEs/HACKs** no código
- **Resíduos do protótipo** removidos (ProtoFeed.tsx, PROTO_FEED_NOTES.md, rota)
- **Package.json**: renomeado para `social-aistudio` com description

## ❌ Bloqueios

### B1 — HTTPS e domínio ausentes

**Severidade**: 🔴 Alta
**O quê**: O app roda em IP nu na porta 3000 sem SSL. Navegadores bloqueiam geolocalização, câmera, notificações e Service Workers sem HTTPS.
**Recomendação**: Instalar Caddy (SSL automático) ou nginx + certbot no VPS e apontar um domínio (ex: `asof.space` ou subdomínio).

### B2 — Dockerfile ausente

**Severidade**: 🟡 Média
**O quê**: Deploy atual é manual (git clone + npm install + pm2). Sem conteinerização para reprodução consistente.
**Recomendação**: Criar Dockerfile multi-stage para build + runtime.

### B3 — Chunk grande (553KB)

**Severidade**: 🟡 Média
**O quê**: `index-*.js` tem 553KB após minificação (>500KB). Impacta tempo de carregamento inicial.
**Recomendação**: Code-splitting adicional com `React.lazy()` em páginas pesadas ou ajuste de `manualChunks`.

## ❓ Precisa de decisão

### D1 — CONTEXT.md e ADRs
**Contexto**: Não existe `CONTEXT.md` (linguagem ubíqua do domínio) nem `docs/adr/` (decisões arquiteturais). O projeto tem documentação extensa mas carece de registro formal de decisões.
**Recomendação**: Usar `/grill-with-docs` para extrair a linguagem ubíqua e criar ADRs para decisões já tomadas (ex: migração Firebase → Supabase, Express server, Strict mode).

### D2 — Deploy automatizado
**Contexto**: O deploy é manual (SSH + git pull + build + pm2 restart). Não há script de deploy nem CI/CD para produção.
**Recomendação**: Criar `deploy.sh` ou um workflow de GitHub Actions que faça deploy automático no VPS via SSH após push na `main`.

### D3 — SMTP no servidor
**Contexto**: O endpoint `/api/admin/notify-request` existe no `server.ts` mas as credenciais SMTP no `.env.local` do VPS estão configuradas? Não verificadas.
**Recomendação**: Verificar se SMTP_HOST, SMTP_USER, SMTP_PASS estão configurados no VPS e testar o envio de email.
