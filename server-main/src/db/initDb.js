// src/db/initDb.js
//
// Inicializa o esquema da base de dados Azure SQL.
// Substitui a versão SQLite anterior.
//

import { getDb } from './database.js';

export async function initDb() {
  const pool = await getDb();

  try {
    // Tabela tickets
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tickets' AND xtype='U')
      CREATE TABLE tickets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ciName NVARCHAR(255),
        ciCat NVARCHAR(255),
        ciSubcat NVARCHAR(255),
        status NVARCHAR(100),
        impact NVARCHAR(100),
        urgency NVARCHAR(100),
        priority NVARCHAR(100),
        openTime NVARCHAR(50),
        resolvedTime NVARCHAR(50),
        closeTime NVARCHAR(50),
        archived INT DEFAULT 0,
        owner_id INT
      )
    `);

    // Tabela webhooks
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='webhooks' AND xtype='U')
      CREATE TABLE webhooks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        url NVARCHAR(500) NOT NULL,
        event NVARCHAR(100) NOT NULL,
        active INT DEFAULT 1,
        createdAt NVARCHAR(50) DEFAULT CONVERT(NVARCHAR, GETDATE(), 126)
      )
    `);

    // Índice único webhooks
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_webhooks_url_event')
      CREATE UNIQUE INDEX idx_webhooks_url_event ON webhooks(url, event)
    `);

    // Tabela users
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        token_version INT DEFAULT 0,
        createdAt NVARCHAR(50) DEFAULT CONVERT(NVARCHAR, GETDATE(), 126)
      )
    `);

    // Tabela audit_log
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_log' AND xtype='U')
      CREATE TABLE audit_log (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT,
        action NVARCHAR(255) NOT NULL,
        target NVARCHAR(255),
        result NVARCHAR(50) NOT NULL,
        ip NVARCHAR(50),
        timestamp NVARCHAR(50) DEFAULT CONVERT(NVARCHAR, GETDATE(), 126)
      )
    `);

    console.log('[DB] Tabelas tickets + webhooks + users + audit_log prontas.');
  } catch (err) {
    console.error('[DB] Erro a criar tabelas:', err.message);
    throw err;
  }
}