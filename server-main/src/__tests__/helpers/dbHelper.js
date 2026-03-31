// src/__tests__/helpers/dbHelper.js
import sqlite3 from 'sqlite3';
import { dbExec } from '../../db/sqliteAsync.js';

/**
 * Cria uma base de dados SQLite em memória com o schema completo.
 * Usada nos testes de integração para ter uma DB real mas isolada.
 */
export const createTestDb = () =>
  new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });

/**
 * Inicializa o schema (tabela tickets) na DB de teste.
 */
export const initTestSchema = async (db) => {
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
      archived INTEGER DEFAULT 0
    );
  `;
  await dbExec(db, sql);
};

/**
 * Limpa todos os tickets entre testes.
 */
export const clearTickets = async (db) => {
  await dbExec(db, 'DELETE FROM tickets');
};