// Responsável por escrever registos na tabela audit_log.
// A tabela é imutável — só INSERT, nunca UPDATE ou DELETE.
//

import { getDb } from '../db/database.js';

/**
 * Regista uma ação no audit log.
 *
 * @param {number|null} userId   - ID do utilizador que executou a ação
 * @param {string}      action   - Descrição da ação (ex: 'ticket.created')
 * @param {string|null} target   - Recurso afetado (ex: 'ticket:42')
 * @param {string}      result   - 'success' ou 'fail'
 * @param {string|null} ip       - IP do pedido
 */
export function auditLog(userId, action, target, result, ip) {
  const db = getDb();

  db.run(
    `INSERT INTO audit_log (userId, action, target, result, ip) VALUES (?, ?, ?, ?, ?)`,
    [userId ?? null, action, target ?? null, result, ip ?? null],
    (err) => {
      if (err) console.error('[AUDIT] Erro ao registar:', err.message);
    }
  );
}