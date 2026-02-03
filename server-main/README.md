# Servidor Principal (server-main)

API REST para gestão de tickets e emissão de notificações via webhooks.

## Variáveis de ambiente

Criar/editar o ficheiro `.env`:

- `PORT` — porta do servidor (por defeito, 3000)
- `WEBHOOK_SECRET` — chave secreta partilhada para assinatura dos webhooks

Exemplo:

```
PORT=3000
WEBHOOK_SECRET=minha-chave-super-secreta
```

## Segurança (assinatura de webhooks)

Cada notificação enviada para os URLs registados é assinada com HMAC-SHA256, usando `WEBHOOK_SECRET`.

- Header enviado: `X-Webhook-Signature: sha256=<hex>`
- Corpo assinado: JSON completo do payload.

O servidor recetor deve validar a assinatura com a mesma chave.
