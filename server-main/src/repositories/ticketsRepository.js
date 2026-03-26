// src/repositories/ticketsRepository.js
//
// Repositório de tickets adaptado para Azure SQL.
// Principais diferenças face ao SQLite:
// - INSERT OR IGNORE → MERGE
// - LIMIT/OFFSET → OFFSET/FETCH
// - lastID → OUTPUT INSERTED.id
//

import { getDb } from '../db/database.js';
import { dbRun, dbGet, dbAll } from '../db/sqliteAsync.js';

/**
 * Método para o import CSV.
 * Usa MERGE para evitar duplicados (equivalente ao INSERT OR IGNORE).
 */
export async function insertTicket(dbOrTicket, maybeTicket) {
  const ticket = maybeTicket ? maybeTicket : dbOrTicket;

  const pool = await getDb();
  const request = pool.request();

  request.input('ciName',       ticket.ciName);
  request.input('ciCat',        ticket.ciCat);
  request.input('ciSubcat',     ticket.ciSubcat);
  request.input('status',       ticket.status);
  request.input('impact',       ticket.impact);
  request.input('urgency',      ticket.urgency);
  request.input('priority',     ticket.priority);
  request.input('openTime',     ticket.openTime);
  request.input('resolvedTime', ticket.resolvedTime);
  request.input('closeTime',    ticket.closeTime);

  const result = await request.query(`
    MERGE INTO tickets AS target
    USING (SELECT
      @ciName AS ciName, @ciCat AS ciCat, @ciSubcat AS ciSubcat,
      @status AS status, @impact AS impact, @urgency AS urgency,
      @priority AS priority, @openTime AS openTime,
      @resolvedTime AS resolvedTime, @closeTime AS closeTime
    ) AS source
    ON (
      target.ciName = source.ciName AND
      target.openTime = source.openTime
    )
    WHEN NOT MATCHED THEN
      INSERT (ciName, ciCat, ciSubcat, status, impact, urgency, priority,
              openTime, resolvedTime, closeTime)
      VALUES (source.ciName, source.ciCat, source.ciSubcat, source.status,
              source.impact, source.urgency, source.priority, source.openTime,
              source.resolvedTime, source.closeTime);
  `);

  return result.rowsAffected[0] || 0;
}

/**
 * Criar ticket (API).
 * Retorna o ID criado usando OUTPUT INSERTED.id.
 */
export async function createTicket(ticket) {
  const pool = await getDb();
  const request = pool.request();

  request.input('ciName',       ticket.ciName       || null);
  request.input('ciCat',        ticket.ciCat        || null);
  request.input('ciSubcat',     ticket.ciSubcat      || null);
  request.input('status',       ticket.status        || 'Open');
  request.input('impact',       ticket.impact        || null);
  request.input('urgency',      ticket.urgency       || null);
  request.input('priority',     ticket.priority      || null);
  request.input('openTime',     ticket.openTime      || new Date().toISOString());
  request.input('resolvedTime', ticket.resolvedTime  || null);
  request.input('closeTime',    ticket.closeTime     || null);
  request.input('owner_id',     ticket.owner_id      || null);

  const result = await request.query(`
    INSERT INTO tickets (
      ciName, ciCat, ciSubcat, status, impact, urgency, priority,
      openTime, resolvedTime, closeTime, archived, owner_id
    )
    OUTPUT INSERTED.id
    VALUES (
      @ciName, @ciCat, @ciSubcat, @status, @impact, @urgency, @priority,
      @openTime, @resolvedTime, @closeTime, 0, @owner_id
    )
  `);

  return result.recordset[0].id;
}

/**
 * Obter ticket por ID.
 */
export async function getTicketById(id) {
  return await dbGet(null, 'SELECT * FROM tickets WHERE id = @p0', [id]);
}

/**
 * Atualizar ticket.
 */
export async function updateTicket(id, updated) {
  const sql = `
    UPDATE tickets SET
      ciName = @p0, ciCat = @p1, ciSubcat = @p2,
      status = @p3, impact = @p4, urgency = @p5,
      priority = @p6, openTime = @p7,
      resolvedTime = @p8, closeTime = @p9
    WHERE id = @p10
  `;

  const params = [
    updated.ciName, updated.ciCat, updated.ciSubcat,
    updated.status, updated.impact, updated.urgency,
    updated.priority, updated.openTime,
    updated.resolvedTime, updated.closeTime,
    id
  ];

  const result = await dbRun(null, sql, params);
  return result.changes;
}

/**
 * Arquivar ticket (soft delete).
 */
export async function archiveTicket(id) {
  const result = await dbRun(null,
    'UPDATE tickets SET archived = 1 WHERE id = @p0', [id]);
  return result.changes;
}

/**
 * Listar tickets com filtros + paginação.
 * LIMIT/OFFSET → OFFSET/FETCH (sintaxe SQL Server).
 */
export async function listTickets(whereSql, params, limit, offset) {
  const sql = `
    SELECT *
    FROM tickets
    ${whereSql}
    ORDER BY id DESC
    OFFSET @p${params.length} ROWS
    FETCH NEXT @p${params.length + 1} ROWS ONLY
  `;

  return await dbAll(null, sql, [...params, offset, limit]);
}

/**
 * Contar tickets (para paginação).
 */
export async function countTickets(whereSql, params) {
  const sql = `
    SELECT COUNT(*) AS total
    FROM tickets
    ${whereSql}
  `;

  const row = await dbGet(null, sql, params);
  if (!row || row.total === undefined || row.total === null) return 0;
  return row.total;
}