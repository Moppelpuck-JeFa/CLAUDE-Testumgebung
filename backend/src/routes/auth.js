import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, signToken, requireAuth } from '../auth.js';

export const router = Router();

function userCount() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

function currentUserFromHeader(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Registrierung: der erste Benutzer kann sich ohne Anmeldung selbst anlegen
// (Ersteinrichtung). Danach dürfen nur bereits angemeldete Benutzer weitere
// Benutzer anlegen, da sich alle Benutzer dieselben Imkerei-Daten teilen.
router.post('/register', (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username und password sind erforderlich' });
  if (password.length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' });

  const isFirstUser = userCount() === 0;
  if (!isFirstUser && !currentUserFromHeader(req)) {
    return res.status(401).json({ error: 'Nur angemeldete Benutzer können weitere Benutzer anlegen' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Benutzername bereits vergeben' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)')
    .run(username, name ?? null, passwordHash);
  const user = db.prepare('SELECT id, username, name, erstellt_am FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ user, token: signToken(user) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username und password sind erforderlich' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });
  }
  res.json({
    user: { id: user.id, username: user.username, name: user.name, erstellt_am: user.erstellt_am },
    token: signToken(user),
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, name, erstellt_am FROM users WHERE id = ?').get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  res.json(user);
});

router.get('/users', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT id, username, name, erstellt_am FROM users ORDER BY username').all());
});

router.get('/status', (req, res) => {
  res.json({ setupRequired: userCount() === 0 });
});
