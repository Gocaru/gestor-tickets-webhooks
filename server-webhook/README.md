# Servidor Secundário (server-webhook)

Serviço que recebe notificações (webhooks) do servidor principal e mostra a informação na consola e numa página HTML.

## Variáveis de ambiente

Copiar o ficheiro de exemplo e ajustar:

```bash
cp .env.example .env
```

- `PORT` — porta do servidor (por defeito, 4000)
- `WEBHOOK_SECRET` — deve ser **igual** ao do servidor principal

## Segurança (validação de assinatura)

O endpoint `POST /webhooks` valida o header `X-Webhook-Signature`.

- Se a assinatura for inválida: responde `401 Invalid webhook signature`.
- Se `WEBHOOK_SECRET` não estiver configurada: responde `500 WEBHOOK_SECRET not configured`.

Assinatura esperada:

`sha256=<hex>` onde `<hex>` é o HMAC-SHA256 do corpo JSON bruto do webhook.