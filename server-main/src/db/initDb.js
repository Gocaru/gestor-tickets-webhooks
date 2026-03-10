// src/db/initDb.js
//
// Este módulo é responsável por:
// - inicializar o esquema da base de dados
// - criar tabelas e índices necessários
// - garantir que a aplicação arranca mesmo com DB vazia
//

import { getDb } from './database.js';
import { dbExec } from './sqliteAsync.js';

/**
 * Inicializa a base de dados.
 *
 * - Cria as tabelas se ainda não existirem
 * - Cria índices necessários
 * - Pode ser chamada em segurança em cada arranque
 */
export async function initDb() {
  // SQL de criação das tabelas e índices.
  // Usa "IF NOT EXISTS" para ser idempotente:
  // chamar esta função várias vezes não causa erros.
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ciName TEXT,
      ciCat TEXT,
      ciSubcat TEXT,
      status TEXT,
      impact TEXT,
      urgency TEXT,
      priority TEXT,
      openTime TEXT,
      resolvedTime TEXT,
      closeTime TEXT,
      archived INTEGER DEFAULT 0,
      owner_id INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      event TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Impede registos duplicados do mesmo webhook
    -- (mesma URL + mesmo evento)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_webhooks_url_event
      ON webhooks(url, event);

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      token_version INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT NOT NULL,
      target TEXT,
      result TEXT NOT NULL,
      ip TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    // Executa o SQL em bloco usando helper assíncrono
    await dbExec(getDb(), sql);

    // Log informativo de sucesso
    console.log('[DB] Tabelas tickets + webhooks + users + audit_log prontas.');
  } catch (err) {
    // Log claro em caso de falha
    console.error('[DB] Erro a criar tabelas:', err.message);

    // Propaga o erro para impedir que o servidor arranque em estado inconsistente
    throw err;
  }
}