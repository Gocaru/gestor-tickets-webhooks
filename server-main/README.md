# Servidor Principal (server-main)

API REST para gestão de tickets e emissão de notificações via webhooks.

## Variáveis de ambiente

`PORT` é obrigatório (não existe fallback no código).

Criar/editar o ficheiro `.env`:

- `PORT` — porta do servidor (obrigatória)
- `WEBHOOK_SECRET` — chave secreta partilhada para assinatura dos webhooks

Exemplo:

```
PORT=3000
WEBHOOK_SECRET=minha-chave-super-secreta
```

Arranque via terminal (com .env configurado):
```bash
npm run dev
```

## Segurança (assinatura de webhooks)

Cada notificação enviada para os URLs registados é assinada com HMAC-SHA256, usando `WEBHOOK_SECRET`.

- Header enviado: `X-Webhook-Signature: sha256=<hex>`
- Corpo assinado: JSON completo do payload.

O servidor recetor deve validar a assinatura com a mesma chave.
