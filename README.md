# Gestor de Tickets com Webhooks

## Descrição
Projeto académico em Node.js com dois servidores independentes:
- Servidor Principal (API REST)
- Servidor Secundário (Recetor de Webhooks)

## Tecnologias
- Node.js
- Express
- Swagger (OpenAPI 3.0)

## Estrutura do Projeto
- `server-main/` — servidor principal (API REST + SQLite)
- `server-webhook/` — servidor recetor de webhooks

## Como correr

### 1) Instalar dependências

```bash
cd server-main
npm install
```

```bash
cd ../server-webhook
npm install
```

### 2) Configurar variáveis de ambiente

Criar um ficheiro `.env` em cada servidor com a mesma `WEBHOOK_SECRET`.

`server-main/.env`:
```
PORT=3000
WEBHOOK_SECRET=minha-chave-super-secreta
```

`server-webhook/.env`:
```
PORT=4000
WEBHOOK_SECRET=minha-chave-super-secreta
```

### 3) Iniciar os servidores (em terminais separados)

Servidor principal:
```bash
cd server-main
npm run dev
```

Servidor webhook:
```bash
cd server-webhook
npm start
```

### 4) Endereços úteis
- API principal: `http://localhost:3000`
- Healthcheck: `GET /health`
- Webhook receiver (UI): `http://localhost:4000`

## Documentação da API (OpenAPI 3.0)

A especificação OpenAPI do servidor principal está em:
- `server-main/openapi.yaml`

## Webhooks

O servidor principal envia notificações `ticket.created`, `ticket.updated` e `ticket.archived` para todos os webhooks registados.

## Segurança

### Chave secreta partilhada (WEBHOOK_SECRET)

Para garantir que as notificações (webhooks) **provêm do servidor principal**, o projeto usa uma chave secreta partilhada (`WEBHOOK_SECRET`) e uma assinatura HMAC.

- O **servidor principal** assina o corpo do webhook com **HMAC-SHA256** e envia o header:
  - `X-Webhook-Signature: sha256=<hex>`
- O **servidor secundário** recalcula a assinatura com a mesma `WEBHOOK_SECRET` e **rejeita** pedidos com assinatura inválida (`401`).

> Nota: Todos os segredos ficam em ficheiros `.env` (ou variáveis de ambiente) e não devem ser hardcoded.
