// src/db/database.js
//
// Ligação ao Azure SQL Server usando o driver mssql.
// Substitui a ligação SQLite anterior.
//

import sql from 'mssql';

// Configuração da ligação ao Azure SQL
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433,
  options: {
    encrypt: true,           // Obrigatório no Azure SQL
    trustServerCertificate: false,
  },
  pool: {
    max: 10,                 // Máximo de ligações simultâneas
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool de ligações — equivalente ao singleton do SQLite
let pool = null;

export async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('[DB] Ligação ao Azure SQL estabelecida com sucesso.');
  }
  return pool;
}

// Exporta o sql para usar nos repositórios
export { sql };

// Fecho limpo quando a aplicação termina
process.on('SIGINT', async () => {
  if (pool) {
    await pool.close();
    console.log('[DB] Ligação ao Azure SQL fechada.');
  }
  process.exit(0);
});