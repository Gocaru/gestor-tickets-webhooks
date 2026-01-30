import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const dbPath = path.join(dirname, '../../tickets.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir a base de dados:', err.message);
    return;
  }
  console.log('Base de dados SQLite ligada com sucesso.');
});