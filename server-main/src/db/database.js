// src/db/database.js
//
// Este módulo é responsável por:
// - criar a ligação à base de dados SQLite
// - garantir uma instância única (singleton)
// - fornecer um ponto central de acesso à DB
// - fechar a ligação de forma limpa quando a aplicação termina
//

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Em módulos ES (type: "module"), __dirname não existe.
// Estas duas linhas recriam o comportamento de __filename e __dirname.
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Caminho absoluto e consistente para a base de dados.
// Independentemente de onde a app é executada,
// a DB fica sempre em: server-main/tickets.db
const dbPath = path.join(dirname, '../../tickets.db');

// Criação da instância única da base de dados (singleton).
// Todos os repositórios usam esta mesma ligação.
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    // Erro ao abrir a DB (ex.: permissões, caminho inválido)
    console.error('[DB] Erro ao abrir a base de dados:', err.message);
    return;
  }

  // Log informativo para confirmar ligação bem-sucedida
  console.log('[DB] Base de dados SQLite ligada com sucesso.');
});

// Getter para a instância da DB.
// Evita múltiplos imports diretos e garante sempre a mesma ligação.
export function getDb() {
  return db;
}

// Fecho limpo da base de dados quando a aplicação é interrompida (Ctrl + C).
// Isto evita ficheiros SQLite "-journal" pendurados
// e garante integridade dos dados.
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('[DB] Erro ao fechar a base de dados:', err.message);
    } else {
      console.log('[DB] Base de dados SQLite fechada com sucesso.');
    }

    // Termina o processo Node.js de forma controlada
    process.exit(0);
  });
});
