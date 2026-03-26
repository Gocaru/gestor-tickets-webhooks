// src/services/auditService.js
//
// Responsável por escrever registos na tabela audit_log.
// A tabela é imutável — só INSERT, nunca UPDATE ou DELETE.
//

import { getDb } from '../db/database.js';

/**
 * Regista uma ação no audit log.
 */
export async function auditLog(userId, action, target, result, ip) {
  try {
    const pool = await getDb();
    await pool.request()
      .input('userId',  userId  ?? null)
      .input('action',  action)
      .input('target',  target  ?? null)
      .input('result',  result)
      .input('ip',      ip      ?? null)
      .query(`
        INSERT INTO audit_log (userId, action, target, result, ip)
        VALUES (@userId, @action, @target, @result, @ip)
      `);
  } catch (err) {
    console.error('[AUDIT] Erro ao registar:', err.message);
  }
}