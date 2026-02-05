// src/db/sqliteAsync.js
//
// Este módulo fornece helpers assíncronos (Promise-based)
// para a biblioteca sqlite3, que usa callbacks por defeito.
//
// Objetivo:
// - permitir o uso de async / await
// - evitar callbacks espalhados pelos repositórios
// - tornar o código mais legível e consistente
//

/**
 * Executa uma query SELECT que devolve UMA única linha.
 *
 * @param {sqlite3.Database} db - Instância da base de dados SQLite
 * @param {string} sql - Query SQL com placeholders (?)
 * @param {Array} params - Parâmetros da query (opcional)
 * @returns {Promise<Object|null>} - Linha encontrada ou null/undefined
 */
export function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    // db.get devolve apenas uma linha
    db.get(sql, params, (err, row) => {
      if (err) {
        // Se houver erro SQL, rejeita a Promise
        return reject(err);
      }

      // Resolve com a linha encontrada (ou undefined se não existir)
      resolve(row);
    });
  });
}

/**
 * Executa uma query SELECT que devolve VÁRIAS linhas.
 *
 * @param {sqlite3.Database} db - Instância da base de dados SQLite
 * @param {string} sql - Query SQL com placeholders (?)
 * @param {Array} params - Parâmetros da query (opcional)
 * @returns {Promise<Array>} - Array de linhas (vazio se não houver resultados)
 */
export function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    // db.all devolve um array de linhas
    db.all(sql, params, (err, rows) => {
      if (err) {
        // Erro SQL → rejeita a Promise
        return reject(err);
      }

      // Resolve sempre com um array
      resolve(rows);
    });
  });
}

/**
 * Executa uma query que ALTERA dados (INSERT, UPDATE, DELETE).
 *
 * @param {sqlite3.Database} db - Instância da base de dados SQLite
 * @param {string} sql - Query SQL com placeholders (?)
 * @param {Array} params - Parâmetros da query (opcional)
 * @returns {Promise<Object>} - { changes, lastID }
 */
export function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    // ⚠️ Usa function normal para aceder a "this"
    db.run(sql, params, function (err) {
      if (err) {
        // Erro SQL → rejeita a Promise
        return reject(err);
      }

      // this.changes → nº de linhas afetadas
      // this.lastID → ID gerado (em INSERTs)
      resolve({
        changes: this.changes,
        lastID: this.lastID
      });
    });
  });
}

/**
 * Executa SQL em bloco (ex.: CREATE TABLE, múltiplas instruções).
 *
 * @param {sqlite3.Database} db - Instância da base de dados SQLite
 * @param {string} sql - Bloco SQL completo
 * @returns {Promise<void>}
 */
export function dbExec(db, sql) {
  return new Promise((resolve, reject) => {
    // db.exec executa todas as instruções de uma vez
    db.exec(sql, (err) => {
      if (err) {
        // Erro ao executar SQL
        return reject(err);
      }

      // Sucesso (não devolve dados)
      resolve();
    });
  });
}
