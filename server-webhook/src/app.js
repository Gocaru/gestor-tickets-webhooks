import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const receivedWebhooks = [];

app.post('/webhooks', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Servidor webhook a correr em http://localhost:${PORT}`);
});
