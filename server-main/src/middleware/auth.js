// src/middleware/auth.js
//
// Este módulo é responsável por:
// - verificar tokens JWT em cada pedido autenticado
// - verificar o role do utilizador (RBAC)
// - invalidar tokens após mudança de password (token_version)
//

import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.js';

/**
 * Middleware de autenticação.
 *
 * - Lê o Bearer token do header Authorization
 * - Verifica a assinatura JWT
 * - Verifica token_version para detetar tokens invalidados
 * - Injeta req.user com { userId, role, tokenVersion }
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token em falta' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();

    db.get('SELECT token_version FROM users WHERE id = ?', [payload.userId], (err, row) => {
      if (err || !row) {
        return res.status(401).json({ error: 'Utilizador não encontrado' });
      }

      if (row.token_version !== payload.tokenVersion) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      req.user = payload;
      next();
    });
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Middleware de autorização por role (RBAC).
 *
 * - Aceita um ou mais roles: requireRole('admin') ou requireRole('agent', 'admin')
 * - Aplica requireAuth automaticamente antes de verificar o role
 * - Responde 403 se o role do utilizador não estiver na lista
 *
 * Exemplo de uso numa rota:
 *   router.delete('/:id', requireRole('agent', 'admin'), archiveTicket);
 */
export function requireRole(...roles) {
  const allowed = roles.flat();

  return [
    requireAuth,
    (req, res, next) => {
      if (!allowed.includes(req.user.role)) {
        return res.status(403).json({
          error: `Acesso negado. Requer papel: ${allowed.join(' ou ')}. O teu papel: ${req.user.role}`
        });
      }
      next();
    }
  ];
}