# Social-ASOF

Comunidade exclusiva para associados da ASOF. Conecte-se, compartilhe e colabore.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Express (Vite middleware em dev, static em prod)
- **Banco:** Supabase (PostgreSQL + Auth + Realtime)
- **Testes:** Vitest + Testing Library
- **Build:** Vite + esbuild

## Desenvolvimento

**Pré-requisitos:** Node.js 20+

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar produção local
npm start
```

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite + Express) |
| `npm run build` | Build de produção |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm run test` | Rodar testes (Vitest) |
| `npm run clean` | Limpar build |

## Supabase

Migrations estão em `supabase/migrations/`. Para aplicar no remoto:

```bash
npx supabase link --project-ref seu-ref
npx supabase db push
```

### Scripts auxiliares

```bash
# Testar conexão
npx tsx supabase/test-connection.ts

# Seed de dados de teste
npx tsx supabase/seed-data.ts

# Configurar usuário admin
npx tsx supabase/setup-admin.ts
```
