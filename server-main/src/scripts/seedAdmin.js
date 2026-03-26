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

  const pool = await getDb();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Verifica se o admin já existe
  const existing = await pool.request()
    .input('username', ADMIN_USERNAME)
    .query('SELECT id FROM users WHERE username = @username');

  if (existing.recordset.length > 0) {
    console.log('[SEED] Utilizador admin já existe — nada alterado.');
    process.exit(0);
  }

  // Cria o admin
  await pool.request()
    .input('username', ADMIN_USERNAME)
    .input('password', hash)
    .input('role', 'admin')
    .query('INSERT INTO users (username, password, role) VALUES (@username, @password, @role)');

  console.log('[SEED] Admin criado com sucesso.');
  console.log(`       Username: ${ADMIN_USERNAME}`);
  console.log(`       Password: ${ADMIN_PASSWORD}`);
  console.log('       ⚠️  Muda a password depois do primeiro login!');

  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('[SEED] Erro:', err.message);
  process.exit(1);
});