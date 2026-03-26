// src/routes/authRoutes.js
//
// Este módulo é responsável por:
// - registo de novos utilizadores (POST /auth/register)
// - login e emissão de tokens JWT (POST /auth/login)
// - renovação do access token via refresh token (POST /auth/refresh)
// - logout (POST /auth/logout)
//

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

// Rate limiting: bloqueia IP após 5 tentativas falhadas em 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'IP bloqueado por 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Gera access token e refresh token para um utilizador.
 */
function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      tokenVersion: user.token_version,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tokenVersion: user.token_version,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  return { accessToken, refreshToken };
}

/**
 * POST /auth/register
 *
 * - Registo público cria sempre utilizadores com role 'user'
 * - Password é guardada com hash bcrypt (saltRounds = 12)
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  // Validação de força da password
  const strongPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({
      error: 'Password fraca: mínimo 8 caracteres, um número e um símbolo (!@#$%^&*)'
    });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const db = getDb();

    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, 'user'],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Username já existe' });
        }

        // 📋 Registar no audit log
        auditLog(this.lastID, 'auth.register', null, 'success', req.ip);

        res.status(201).json({ message: 'Utilizador criado com sucesso' });
      }
    );
  } catch (err) {
    console.error('[AUTH] Erro no registo:', err.message);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
});

/**
 * POST /auth/login
 *
 * - Rate limiting aplicado (5 tentativas por 15 min)
 * - Devolve access token no body e refresh token em cookie HttpOnly
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  const db = getDb();

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      // 📋 Registar tentativa falhada (utilizador desconhecido)
      auditLog(null, 'auth.login', null, 'fail', req.ip);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // 📋 Registar tentativa falhada (password errada)
      auditLog(user.id, 'auth.login', null, 'fail', req.ip);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Refresh token em cookie HttpOnly — não acessível por JavaScript
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,       // mudar para true em produção (HTTPS)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 📋 Registar login bem-sucedido
    auditLog(user.id, 'auth.login', null, 'success', req.ip);

    res.json({
      message: 'Login bem-sucedido',
      accessToken,
      role: user.role,
      username: user.username,
    });
  });
});

/**
 * POST /auth/refresh
 *
 * - Lê o refresh token do cookie HttpOnly
 * - Verifica token_version para detetar tokens invalidados
 * - Devolve novo access token
 */
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token em falta' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const db = getDb();

    db.get('SELECT * FROM users WHERE id = ?', [payload.userId], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Utilizador não encontrado' });
      }

      if (user.token_version !== payload.tokenVersion) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      const { accessToken } = generateTokens(user);

      // 📋 Registar renovação de token
      auditLog(user.id, 'auth.refresh', null, 'success', req.ip);

      res.json({ accessToken });
    });
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
});

/**
 * POST /auth/logout
 *
 * - Remove o cookie do refresh token
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