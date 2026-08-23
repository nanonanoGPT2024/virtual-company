import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pool } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'virtulabs-company-os-secret-2026';

// Password Hashing Helper using SHA-256 with Salt
export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

// Lightweight token generator (Base64 signature)
export function createToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

// Authentication Middleware
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as any).user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    (req as any).user = null;
    return next();
  }

  try {
    const userRes = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.userId]);
    if (userRes.rows.length > 0) {
      (req as any).user = userRes.rows[0];
    } else {
      (req as any).user = null;
    }
  } catch (e) {
    (req as any).user = null;
  }
  next();
}

// 1. POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const role = cleanEmail === 'nano@company.os' || cleanEmail.includes('owner') ? 'OWNER' : 'CLIENT';
    const hashed = hashPassword(password);

    const insertRes = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`,
      [userId, name.trim(), cleanEmail, hashed, role]
    );

    const user = insertRes.rows[0];
    const token = createToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil',
      token,
      user
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await pool.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Akun dengan email tersebut tidak ditemukan' });
    }

    const user = userRes.rows[0];
    const hashed = hashPassword(password);

    // Support backward-compatible check if plain or hashed
    const isPasswordMatch = (user.password_hash === hashed) || (user.password_hash === password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Password yang Anda masukkan salah' });
    }

    // Auto-upgrade plain password to hash if matched plain
    if (user.password_hash === password) {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, user.id]).catch(() => {});
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/auth/me
router.get('/me', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Token tidak valid atau sesi telah berakhir.' });
  }
  res.json({ success: true, user });
});

export default router;
