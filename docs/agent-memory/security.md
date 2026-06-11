# Security — Regras de Segurança e Áreas Sensíveis

## Revisão de planos `improve` antes de executar

- Planos gerados pelo `improve` skill podem conter SQL destrutivo que sobrescreve views ou tabelas existentes.
- **Caso concreto (2026-06-11)**: O plano `009-server-side-member-matching.md` original incluía `CREATE OR REPLACE VIEW users_public ...` que sobrescreveria a view existente definida em `20260609000300_add_profile_contact.sql:12-25`, destruindo colunas condicionais de privacidade:
  ```sql
  CASE WHEN show_phone THEN phone ELSE NULL END AS phone,
  CASE WHEN show_email THEN email ELSE NULL END AS email
  ```
- **Regra**: Antes de executar qualquer plano de melhoria que mencione `CREATE OR REPLACE VIEW`, `ALTER TABLE`, `DROP`, ou `SECURITY DEFINER`, verificar se o comando conflita com objetos existentes que contêm lógica de privacidade ou segurança.

## DROP COLUMN em produção requer verificação prévia

- **Caso**: A migration original de CPF encryption incluía `ALTER TABLE member_requests DROP COLUMN IF EXISTS cpf`. Isso remove a coluna plaintext antes de confirmar que `cpf_encrypted` está populado e funcionando em produção.
- **Ação tomada**: Removido o DROP COLUMN da migration. A coluna `cpf` será removida em migration follow-up após verificação.
- **Regra**: Nunca incluir `DROP COLUMN` na mesma migration que adiciona a coluna de substituição. Criar migration separada para remover colunas, e só aplicar após confirmar que dados migrados estão íntegros.

## Configuração de chave de criptografia é ação manual no Dashboard

- A variável `app.asof_crypt_key` (usada por `pgp_sym_encrypt`/`pgp_sym_decrypt`) **deve** ser configurada como Database Session Setting no Supabase Dashboard (Settings → Database → Session settings) antes de a aplicação usar as RPCs de criptografia.
- Não é possível configurar essa chave via CLI ou migration — ela não deve ser incluída no código.
- **Pendente**: A chave ainda não foi configurada. As RPCs `insert_member_request`, `get_member_requests_for_admin` e `create_user_from_member_request` vão falhar até que seja.