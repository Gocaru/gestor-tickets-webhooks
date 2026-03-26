import express from 'express';
import 'dotenv/config';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('PORT is required');
}

// Guardar o corpo bruto para permitir validação de assinatura (HMAC)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

const receivedWebhooks = [];

app.post('/webhooks', (req, res) => {
  // Segurança: validar que o webhook foi assinado com a mesma WEBHOOK_SECRET
  const secret = (process.env.WEBHOOK_SECRET || '').trim();
  const signatureHeader = (req.get('X-Webhook-Signature') || '').trim();

  if (!secret) {
    // Se não houver secret configurada, rejeita para evitar aceitar notificações de qualquer origem.
    return res.status(500).json({ ok: false, message: 'WEBHOOK_SECRET not configured' });
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || Buffer.from(''))
    .digest('hex')}`;

  // Comparação em tempo constante para reduzir risco de timing attacks
  const valid =
    signatureHeader.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));

  if (!valid) {
    console.warn('⚠️  Webhook rejeitado: assinatura inválida.');
    return res.status(401).json({ ok: false, message: 'Invalid webhook signature' });
  }

  const payload = req.body;

  receivedWebhooks.unshift({
    receivedAt: new Date().toISOString(),
    payload
  });

  if (receivedWebhooks.length > 50) {
    receivedWebhooks.pop();
  }

  console.log('🔔 Webhook recebido:', JSON.stringify(payload, null, 2));
  res.status(200).json({ ok: true });
});

app.get('/', (req, res) => {
  const html = `
    <html>
      <head><meta charset="utf-8"><title>Webhook Receiver</title></head>
      <body style="font-family: Arial; max-width: 900px; margin: 40px auto;">
        <h1>Webhook Receiver</h1>
        <p>Endpoint: <code>POST /webhooks</code></p>
        ${receivedWebhooks.length === 0
          ? '<p><i>Nenhum webhook recebido ainda.</i></p>'
          : receivedWebhooks.map(w => `
              <div style="border:1px solid #ccc; border-radius:6px; padding:10px; margin-bottom:15px;">
                <div><b>Recebido em:</b> ${w.receivedAt}</div>
                <pre>${escapeHtml(JSON.stringify(w.payload, null, 2))}</pre>
              </div>
            `).join('')
        }
      </body>
    </html>
  `;
  res.send(html);
});

function escapeHtml(str) {
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

app.listen(Number(PORT), () => {
  console.log(`[SERVER] Servidor webhook a correr em http://localhost:${PORT}`);

});
