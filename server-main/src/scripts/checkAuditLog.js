import 'dotenv/config';
import { getDb } from '../db/database.js';
import { initDb } from '../db/initDb.js';

await initDb();

const db = getDb();

db.all('SELECT * FROM audit_log ORDER BY timestamp DESC', [], (err, rows) => {
  if (err) {
    console.error('[AUDIT] Erro:', err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('[AUDIT] Tabela vazia.');
  } else {
    console.log(`[AUDIT] ${rows.length} registos encontrados:\n`);
    rows.forEach(row => {
      console.log(`  [${row.timestamp}] userId=${row.userId} | action=${row.action} | target=${row.target} | result=${row.result} | ip=${row.ip}`);
    });
  }

  process.exit(0);
});