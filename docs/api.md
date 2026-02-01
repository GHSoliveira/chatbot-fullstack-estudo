# Documentação da API FiberAdmin

## Base URL
```
http://localhost:3001/api
```

## Autenticação

A API usa tokens customizados no formato `tk.{userId}.{timestamp}`. 

### Header de Autorização
```
Authorization: tk.u_admin.1234567890
```

### Resposta 401
Quando o token é inválido ou expirou, a API retorna:
```json
{
  "error": "Sessão inválida"
}
```

---

## Endpoints

### 🔐 Autenticação

#### POST /auth/login
Realiza login do usuário.

**Request Body:**
```json
{
  "username": "admin",
  "password": "123"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "u_admin",
    "name": "Admin Full",
    "username": "admin",
    "role": "ADMIN",
    "queues": []
  },
  "token": "tk.u_admin.1234567890"
}
```

**Response 401:**
```json
{
  "error": "Dados incorretos"
}
```

---

#### POST /auth/heartbeat
Mantém a sessão do usuário ativa. Deve ser chamado periodicamente (recomendado: a cada 10s).

**Headers:**
```
Authorization: tk.u_admin.1234567890
```

**Response 200:**
```json
{
  "ok": true
}
```

---

### 💬 Chat Engine

#### POST /chats/init
Inicializa uma nova conversa ou retorna uma existente.

**Request Body:**
```json
{
  "customerCpf": "38192457011"
}
```

**Response 200:**
```json
{
  "id": "chat_1234567890",
  "customerCpf": "38192457011",
  "status": "bot",
  "messages": [],
  "variables": {},
  "agentId": null
}
```

---

#### POST /chats/:id/messages
Adiciona uma mensagem ao chat.

**Request Body:**
```json
{
  "sender": "bot",
  "text": "Olá! Como posso ajudar?"
}
```

**Response 200:**
```json
{
  "sender": "bot",
  "text": "Olá! Como posso ajudar?",
  "timestamp": "2026-01-31T10:30:00.000Z"
}
```

---

#### PUT /chats/:id/vars
Atualiza variáveis do chat (usado pelo fluxo do bot).

**Request Body:**
```json
{
  "cpf": "38192457011",
  "nome_cliente": "João Silva"
}
```

**Response 200:**
```json
{
  "cpf": "38192457011",
  "nome_cliente": "João Silva"
}
```

---

#### POST /chats/transfer
Transfere um chat para uma fila de atendimento humano.

**Request Body:**
```json
{
  "chatId": "chat_1234567890",
  "queue": "SUPORTE",
  "agentId": null
}
```

**Response 200:**
```json
{
  "id": "chat_1234567890",
  "customerCpf": "38192457011",
  "status": "waiting",
  "queue": "SUPORTE",
  "agentId": null
}
```

---

#### GET /chats/my-queues
Retorna chats ativos e em espera para o agente logado.

**Response 200:**
```json
{
  "active": [
    {
      "id": "chat_1234567890",
      "customerCpf": "38192457011",
      "status": "open",
      "agentId": "u_123",
      "messages": []
    }
  ],
  "waiting": [
    {
      "id": "chat_1234567891",
      "customerCpf": "74218390544",
      "status": "waiting",
      "queue": "SUPORTE",
      "agentId": null
    }
  ]
}
```

---

#### POST /chats/pickup
Agente pega um chat da fila de espera.

**Request Body:**
```json
{
  "chatId": "chat_1234567891"
}
```

**Response 200:**
```json
{
  "id": "chat_1234567891",
  "status": "open",
  "agentId": "u_123",
  "agentName": "João Agente",
  "messages": [
    {
      "sender": "system",
      "text": "Você será atendido por João Agente.",
      "timestamp": "2026-01-31T10:30:00.000Z"
    }
  ]
}
```

**Response 400:**
```json
{
  "error": "Indisponível"
}
```

---

#### PUT /chats/:id/close
Encerra um atendimento.

**Response 200:**
```json
{
  "success": true
}
```

---

#### GET /chats/history/:cpf
Retorna histórico de chats fechados de um cliente.

**Response 200:**
```json
[
  {
    "id": "chat_1234567880",
    "customerCpf": "38192457011",
    "status": "closed",
    "messages": [],
    "closedAt": "2026-01-30T15:00:00.000Z"
  }
]
```

---

### 👥 Clientes (ERP)

#### GET /customers/search/:cpf
Busca informações do cliente no ERP simulado.

**Response 200:**
```json
{
  "id": "101",
  "cpf": "38192457011",
  "razao_social": "João Silva Oliveira",
  "ativo": "true",
  "online": "true",
  "faturas_atraso": "false",
  "qtd_faturas_atraso": "0",
  "plano": "500 Mega"
}
```

**Response 404:**
```json
{
  "error": "Não encontrado"
}
```

---

### 📊 Monitoramento

#### GET /monitoring/overview
Visão geral do sistema (requer ADMIN ou MANAGER).

**Response 200:**
```json
{
  "chats": [
    {
      "id": "chat_123",
      "customerCpf": "38192457011",
      "status": "waiting",
      "queue": "SUPORTE"
    }
  ],
  "agents": [
    {
      "id": "u_agent1",
      "name": "Agente 1",
      "role": "AGENT",
      "queues": ["SUPORTE"],
      "isOnline": true
    }
  ]
}
```

---

### 📋 Fluxos

#### GET /flows
Lista todos os fluxos.

**Response 200:**
```json
[
  {
    "id": "1",
    "name": "Suporte e Atendimento",
    "draft": {
      "nodes": [],
      "edges": []
    },
    "published": null
  }
]
```

---

#### GET /flows/:id
Retorna detalhes de um fluxo específico.

---

#### POST /flows
Cria um novo fluxo (requer ADMIN).

**Request Body:**
```json
{
  "name": "Novo Fluxo"
}
```

**Response 200:**
```json
{
  "id": "1234567890",
  "name": "Novo Fluxo",
  "draft": {
    "nodes": [],
    "edges": []
  },
  "published": null
}
```

**Response 400:**
```json
{
  "error": "Flow já existe"
}
```

---

#### PUT /flows/:id
Atualiza um fluxo. Se `publish: true`, publica a versão.

**Request Body:**
```json
{
  "nodes": [...],
  "edges": [...],
  "publish": true
}
```

**Response 200:**
```json
{
  "success": true
}
```

---

#### DELETE /flows/:id
Remove um fluxo (requer ADMIN).

**Response 200:**
```json
{
  "success": true
}
```

---

### 👤 Usuários

#### GET /users
Lista todos os usuários (sem senhas).

**Response 200:**
```json
[
  {
    "id": "u_123",
    "name": "João Agente",
    "username": "joao",
    "role": "AGENT",
    "queues": ["SUPORTE", "COBRANÇA"]
  }
]
```

---

#### POST /users
Cria um novo usuário (requer ADMIN).

**Request Body:**
```json
{
  "name": "Novo Agente",
  "username": "novoagente",
  "password": "senha123",
  "role": "AGENT",
  "queues": ["SUPORTE"]
}
```

**Response 200:**
```json
{
  "success": true
}
```

**Response 400:**
```json
{
  "error": "User existe"
}
```

---

#### DELETE /users/:id
Remove um usuário (requer ADMIN).

**Response 200:**
```json
{
  "success": true
}
```

---

### 📝 Logs

#### GET /logs
Retorna logs do sistema (requer ADMIN ou MANAGER).

**Response 200:**
```json
[
  {
    "id": "log_1234567890",
    "timestamp": "2026-01-31T10:30:00.000Z",
    "type": "PUBLISH",
    "message": "Fluxo Suporte publicado."
  }
]
```

---

## Códigos de Erro

| Código | Significado | Quando ocorre |
|--------|-------------|---------------|
| 400 | Bad Request | Dados inválidos, usuário já existe |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Usuário sem permissão |
| 404 | Not Found | Recurso não encontrado |

---

## Papéis (Roles)

| Role | Permissões |
|------|-----------|
| ADMIN | Acesso total a todos os recursos |
| MANAGER | Visualização de fluxos, usuários, logs, monitoramento |
| AGENT | Acesso ao workspace, chats da fila, heartbeat |

---

## Exemplos de Uso

### Fluxo Completo: Login + Criar Fluxo

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'

# Response: {"user":{...},"token":"tk.u_admin.1234567890"}

# 2. Criar fluxo
curl -X POST http://localhost:3001/api/flows \
  -H "Content-Type: application/json" \
  -H "Authorization: tk.u_admin.1234567890" \
  -d '{"name":"Meu Fluxo"}'

# 3. Publicar fluxo
curl -X PUT http://localhost:3001/api/flows/1234567890 \
  -H "Content-Type: application/json" \
  -H "Authorization: tk.u_admin.1234567890" \
  -d '{"nodes":[...],"edges":[...],"publish":true}'
```

---

## Notas

- O token expira após 15 segundos sem heartbeat
- O banco de dados é um arquivo JSON (`db.json`)
- Dados de clientes são simulados em memória
- Logs são mantidos até 500 entradas (mais recentes primeiro)