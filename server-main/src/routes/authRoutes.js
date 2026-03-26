// src/routes/authRoutes.js

import { auditLog } from '../services/auditService.js';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { getDb } from '../db/database.js';

const router = Router();

const SALT_ROUNDS = 12;
const ACCESS_EXPIRES = '5m';
const REFRESH_EXPIRES = '7d';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'IP bloqueado por 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, tokenVersion: user.token_version },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenVersion: user.token_version },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  return { accessToken, refreshToken };
}

/**
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  const strongPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({
      error: 'Password fraca: mínimo 8 caracteres, um número e um símbolo (!@#$%^&*)'
    });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const pool = await getDb();

    // Verifica se já existe
    const existing = await pool.request()
      .input('username', username)
      .query('SELECT id FROM users WHERE username = @username');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: 'Username já existe' });
    }

    const result = await pool.request()
      .input('username', username)
      .input('password', hash)
      .input('role', 'user')
      .query(`
        INSERT INTO users (username, password, role)
        OUTPUT INSERTED.id
        VALUES (@username, @password, @role)
      `);

    const newId = result.recordset[0].id;
    auditLog(newId, 'auth.register', null, 'success', req.ip);
    res.status(201).json({ message: 'Utilizador criado com sucesso' });

  } catch (err) {
    console.error('[AUTH] Erro no registo:', err.message);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
});

/**
 * POST /auth/login
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username');

    const user = result.recordset[0];

    if (!user) {
      auditLog(null, 'auth.login', null, 'fail', req.ip);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      auditLog(user.id, 'auth.login', null, 'fail', req.ip);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    auditLog(user.id, 'auth.login', null, 'success', req.ip);

    res.json({
      message: 'Login bem-sucedido',
      accessToken,
      role: user.role,
      username: user.username,
    });

  } catch (err) {
    console.error('[AUTH] Erro no login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * POST /auth/refresh
 */
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token em falta' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const pool = await getDb();

    const result = await pool.request()
      .input('id', payload.userId)
      .query('SELECT * FROM users WHERE id = @id');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Utilizador não encontrado' });
    }

    if (user.token_version !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    const { accessToken } = generateTokens(user);
    auditLog(user.id, 'auth.refresh', null, 'success', req.ip);
    res.json({ accessToken });

  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });
  res.json({ message: 'Logout efetuado com sucesso' });
});

export default router;