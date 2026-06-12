# 1Password CLI (op) — Autenticação na VPS

## Visão Geral

A VPS **OpenClaw** (vmi3089902, Tailscale `100.89.205.100`) usa um **Service Account** do 1Password para autenticar o CLI `op`. Isso permite acessar secrets do vault **Dev** sem depender de biometria ou sessão interativa.

## Arquitetura

```
 MacBook (1Password desktop + CLI)          VPS OpenClaw
 ┌─────────────────────────────────┐       ┌──────────────────────────┐
 │ 1Password Desktop App (unlocked)│       │ Service Account Token    │
 │ SSH Agent (IdentityAgent)      │       │ /root/.op/               │
 │ ForwardAgent via SSH           │◄──────│ op CLI autenticado       │
 │ /tmp/1p-agent.sock (symlink)   │       │ tmux session "op"        │
 └─────────────────────────────────┘       │ /etc/profile.d/op.sh    │
        ↑                                  └──────────────────────────┘
        │ Tailscale
        └──────────── OpenClaw (100.89.205.100)
```

## Conexão SSH

### SSH Config (MacBook → `~/.ssh/config`)

O host `openclaw` já está configurado no MacBook:

```sshconfig
Host openclaw
    HostName 100.89.205.100       # Tailscale IP
    User root
    IdentityFile ~/.ssh/setup_macos_ed25519
    IdentitiesOnly yes
    ForwardAgent yes               # Encaminha agente 1Password para SSH keys
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Conectar:
```bash
ssh openclaw
```

### SSH Agent Forwarding

O `ForwardAgent yes` permite que operações SSH no VPS (ex: `git push` para GitHub) usem chaves SSH armazenadas no 1Password do MacBook. O MacBook precisa estar com o 1Password Desktop desbloqueado.

## 1Password CLI no VPS

### Status atual

| Item | Status |
|------|--------|
| `op` CLI | ✅ v2.30.0 instalado |
| Service Account | ✅ Criado, token em `/root/.op/service-account-token` |
| Autenticação | ✅ `op whoami` → SERVICE_ACCOUNT |
| Acesso a vaults | ✅ `Dev` (read_items) |
| Tmux session | ✅ `op` criada e funcional |
| Profile automático | ✅ `/etc/profile.d/op.sh` |

### Uso diário

```bash
# Conectar ao VPS
ssh openclaw

# Entrar na sessão tmux dedicada do 1Password
tmux attach -t op

# OU em qualquer shell (o profile carrega automaticamente):
export OP_SERVICE_ACCOUNT_TOKEN=$(cat /root/.op/service-account-token)
op whoami
op vault list
op item list --vault Dev
op read "op://Dev/Neon/password"
```

### Tmux session `op`

A sessão `op` do tmux já tem o token carregado. Use `tmux attach -t op` para entrar.

Para criar uma nova sessão com o token:
```bash
tmux new-session -s op
export OP_SERVICE_ACCOUNT_TOKEN=$(cat /root/.op/service-account-token)
```

### Comandos úteis

```bash
# Quem sou eu?
op whoami

# Listar vaults acessíveis
op vault list

# Listar itens do vault Dev
op item list --vault Dev

# Ler um secret específico
op read "op://Dev/Neon/password"

# Executar comando com secrets injetados
op run -- env | grep DATABASE_URL

# Formato JSON (para scripting)
op item list --vault Dev --format json
op read "op://Dev/Neon/password" --format json
```

## Manutenção do Service Account

### O token nunca expira (a menos que configurado).

Para criar um novo service account (se necessário):
```bash
# No MacBook (precisa do 1Password Desktop desbloqueado)
TOKEN=$(op service-account create openclaw-vps --vault Dev:read_items --raw)
echo "$TOKEN" | ssh openclaw 'cat > /root/.op/service-account-token && chmod 600 /root/.op/service-account-token'
```

**Nunca armazene o token em plaintext fora do VPS.** O token foi transferido diretamente via pipe SSH e não existe em nenhum arquivo no MacBook.

### Se o service account expirar ou for revogado

1. Crie um novo service account no [1Password Web UI](https://my.1password.com) ou via CLI
2. Substitua o token no VPS:
   ```bash
   echo "novo_token_aqui" | ssh openclaw 'cat > /root/.op/service-account-token && chmod 600 /root/.op/service-account-token'
   ```
3. Teste: `ssh openclaw 'op whoami'`

### ⚠️ Nota: `test-sa` residual

Durante a configuração, um service account chamado `test-sa` foi criado acidentalmente. Ele pode ser removido pelo painel web do 1Password em:
**https://my.1password.com/settings/service-accounts**

## 1Password Agent Socket (SSH Keys)

O MacBook tem um symlink em `/tmp/1p-agent.sock` que aponta para o socket do agente SSH do 1Password:

```bash
/tmp/1p-agent.sock → ~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock
```

Isso é usado pelo `ForwardAgent` do SSH para operações SSH no VPS (não para o `op` CLI).

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| `op whoami` → "not signed in" | Token não carregado | `source /etc/profile.d/op.sh` |
| `op vault list` → vazio | Service Account sem acesso ao vault | Verificar permissões no web UI |
| SSH falha | Tailscale fora do ar ou Mac dormindo | Verificar `tailscale status` no MacBook |
| `ForwardAgent` não funciona | MacBook sem 1Password desktop aberto | Desbloquear 1Password no Mac |
| `Permission denied (publickey)` na VPS | Chave SSH errada ou IP mudou | Verificar `~/.ssh/setup_macos_ed25519` no Mac |

## Recursos

- [1Password CLI docs](https://developer.1password.com/docs/cli)
- [Service Accounts](https://developer.1password.com/docs/service-accounts)
- [SSH Agent Forwarding](https://developer.1password.com/docs/ssh/agent/forwarding)
