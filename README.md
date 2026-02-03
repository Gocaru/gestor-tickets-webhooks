# Gestor de Tickets com Webhooks

## Descrição
Projeto académico em Node.js com dois servidores independentes:
- Servidor Principal (API REST)
- Servidor Secundário (Receptor de Webhooks)

## Tecnologias
- Node.js
- Express
- Swagger (OpenAPI 3.0)

## Estrutura do Projeto
- server-main/
- server-webhook/

## Como correr
(instruções a completar)

## Webhooks
(descrição a completar)

## Segurança
### Chave secreta partilhada (WEBHOOK_SECRET)

Para garantir que as notificações (webhooks) **provêm do servidor principal**, o projeto usa uma chave secreta partilhada (`WEBHOOK_SECRET`) e uma assinatura HMAC.

- O **servidor principal** assina o corpo do webhook com **HMAC-SHA256** e envia o header:
  - `X-Webhook-Signature: sha256=<hex>`
- O **servidor secundário** recalcula a assinatura com a mesma `WEBHOOK_SECRET` e **rejeita** pedidos com assinatura inválida (`401`).

> Nota: Todos os segredos ficam em ficheiros `.env` (ou variáveis de ambiente) e não devem ser hardcoded.
