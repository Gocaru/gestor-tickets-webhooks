// src/scripts/seedAdmin.js
//
// Script para criar o utilizador admin inicial.
// Corre uma vez: node src/scripts/seedAdmin.js
//

import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { getDb } from '../db/database.js';
import { initDb } from '../db/initDb.js';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123!';

async function seedAdmin() {
  await initDb();

  const db = getDb();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  db.run(
    'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
    [ADMIN_USERNAME, hash, 'admin'],
    function (err) {
      if (err) {
        console.error('[SEED] Erro ao criar admin:', err.message);
        process.exit(1);
      }

      if (this.changes === 0) {
        console.log('[SEED] Utilizador admin já existe — nada alterado.');
      } else {
        console.log(`[SEED] Admin criado com sucesso.`);
        console.log(`       Username: ${ADMIN_USERNAME}`);
        console.log(`       Password: ${ADMIN_PASSWORD}`);
        console.log('       ⚠️  Muda a password depois do primeiro login!');
      }

      process.exit(0);
    }
  );
}

seedAdmin();