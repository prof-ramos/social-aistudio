# PROTÓTIPO — Melhorias para o Feed do Social-ASOF

**Pergunta sendo respondida:** Como o feed da comunidade deveria ser apresentado?

## Como rodar

```bash
npm run dev
```

Abra http://localhost:3000/proto-feed

Alterne entre variações pela URL ou pelo floating switcher no rodapé:
- `?variant=classic` — Clássico Aprimorado (padrão)
- `?variant=editorial` — Editorial
- `?variant=dense` — Compacto
- `?variant=shadcn` — shadcn/ui Style

## Variações

### Clássico Aprimorado
Mantém a estrutura atual (cards, sidebar, toolbar) com refinamentos:
- Menos altura vertical por card
- Tags de categoria coloridas e distintas
- Métricas mais legíveis (reações, comentários, visualizações)

### Editorial
Layout assimétrico inspirado em publicações institucionais:
- **Hero post** em destaque com fundo navy e grid pattern
- Coluna principal (2/3) + sidebar contextual (1/3)
- Tipografia serifada maior nos títulos
- Cards com hover-shadow suave e separadores minimalistas

### Compacto
Máxima densidade de informação, estilo timeline:
- Lista contínua sem cards separados
- Avatar pequeno (32px), metadados inline
- Pill filters na horizontal
- Stream de posts com ações sempre visíveis

### shadcn/ui Style
Estilo moderno SaaS inspirado no shadcn/ui:
- Cards com `rounded-xl`, sombras suaves e bordas sutis
- Badges com `rounded-full` e cores semânticas pastel
- Toolbar compacto com inputs arredondados e tabs integrados
- Ações em botões ghost com hover states

## Estado de cada variante

| Variante | Destaque visual | Densidade | Adequado para |
|---|---|---|---|
| Classic | Cartões definidos | Média | Uso geral, familiaridade |
| Editorial | Hero + grid | Média-baixa | Conteúdo editorial, leitura |
| Compacto | Stream denso | Alta | Power users, timeline rápida |
| shadcn/ui | Cards arredondados | Média | Aplicações modernas, SaaS |

## Para decidir

- Qual sensação o feed deve transmitir? (institucional, ágil, acolhedor?)
- Qual é o dispositivo predominante dos usuários?
- A hierarquia de conteúdo atual reflete os objetivos da comunidade?

## Quando decidir

Absorver o que foi validado neste protótipo no `Feed.tsx` real e deletar este arquivo + rota.
