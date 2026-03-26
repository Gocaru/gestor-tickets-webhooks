// src/db/sqliteAsync.js
//
// Helpers assíncronos para o driver mssql.
// Mantém a mesma interface dos helpers SQLite anteriores
// para minimizar alterações nos repositórios.
//

import { getDb, sql } from './database.js';

/**
 * Executa uma query SELECT que devolve UMA única linha.
 * Equivalente ao db.get() do SQLite.
 */
export async function dbGet(db, sqlQuery, params = []) {
  const pool = await getDb();
  const request = pool.request();

  // Adiciona os parâmetros com nomes automáticos (p0, p1, p2...)
  params.forEach((value, index) => {
    request.input(`p${index}`, value);
  });

  // Substitui os ? pelos @p0, @p1, @p2...
  const query = replacePlaceholders(sqlQuery);
  const result = await request.query(query);

  return result.recordset[0] || null;
}

/**
 * Executa uma query SELECT que devolve VÁRIAS linhas.
 * Equivalente ao db.all() do SQLite.
 */
export async function dbAll(db, sqlQuery, params = []) {
  const pool = await getDb();
  const request = pool.request();

  params.forEach((value, index) => {
    request.input(`p${index}`, value);
  });

  const query = replacePlaceholders(sqlQuery);
  const result = await request.query(query);

  return result.recordset;
}

/**
 * Executa uma query que ALTERA dados (INSERT, UPDATE, DELETE).
 * Equivalente ao db.run() do SQLite.
 * Retorna { changes, lastID } para manter compatibilidade.
 */
export async function dbRun(db, sqlQuery, params = []) {
  const pool = await getDb();
  const request = pool.request();

  params.forEach((value, index) => {
    request.input(`p${index}`, value);
  });

  const query = replacePlaceholders(sqlQuery);
  const result = await request.query(query);

  return {
    changes: result.rowsAffected[0] || 0,
    lastID: result.recordset?.[0]?.id || null
  };
}

/**
 * Executa SQL em bloco (CREATE TABLE, etc.).
 * Equivalente ao db.exec() do SQLite.
 */
export async function dbExec(db, sqlQuery) {
  const pool = await getDb();
  await pool.request().batch(sqlQuery);
}

/**
 * Substitui os placeholders ? pelo formato @p0, @p1, @p2...
 * que o mssql usa em vez de ? do SQLite.
 */
function replacePlaceholders(sqlQuery) {
  let index = 0;
  return sqlQuery.replace(/\?/g, () => `@p${index++}`);
}