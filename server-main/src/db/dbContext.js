// src/db/dbContext.js
// Permite substituir a DB nos testes sem alterar controllers/services

import { db as defaultDb } from './database.js';

let currentDb = defaultDb;

export function getActiveDb() {
  return currentDb;
}

export function setActiveDb(db) {
  currentDb = db;
}
