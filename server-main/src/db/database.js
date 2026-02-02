import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// ✅ Caminho absoluto e consistente para a DB (server-main/tickets.db)
const dbPath = path.join(dirname, '../../tickets.db');

// ✅ Instância única
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir a base de dados:', err.message);
    return;
  }
  console.log('Base de dados SQLite ligada com sucesso.');
});

// ✅ Getter (para evitar imports inconsistentes)
export function getDb() {
  return db;
}

// ✅ Fecho limpo (reduz ficheiros -journal pendurados)
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Erro ao fechar a base de dados:', err.message);
    else console.log('Base de dados SQLite fechada com sucesso.');
    process.exit(0);
  });
});

