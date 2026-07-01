import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { readDb, writeDb } from '../services/database.js';
import { publicUser, signToken } from '../utils/auth.js';

const router = Router();
const passwordResetTtlMs = 30 * 60 * 1000;

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !email || password.length < 8) {
      return next({ status: 400, message: 'Nome, email e password di almeno 8 caratteri sono obbligatori' });
    }

    const db = await readDb();
    const existing = db.users.find((user) => user.email === email);

    if (existing) {
      return next({ status: 409, message: 'Email gia registrata' });
    }

    const user = {
      id: nanoid(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      passwordVersion: 1,
      passwordChangedAt: new Date().toISOString(),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    await writeDb(db);

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const db = await readDb();
    const user = db.users.find((item) => item.email === email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next({ status: 401, message: 'Credenziali non valide' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/password-reset/request', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return next({ status: 400, message: "Inserisci l'email del tuo account" });
    }

    const db = await readDb();
    const user = db.users.find((item) => item.email === email);

    if (!user) {
      return res.json({ message: "Se l'email esiste, troverai un token di recupero nella risposta." });
    }

    const recoveryToken = nanoid(32);
    const tokenExpiresAt = new Date(Date.now() + passwordResetTtlMs).toISOString();

    user.passwordResetTokenHash = await bcrypt.hash(recoveryToken, 12);
    user.passwordResetExpiresAt = tokenExpiresAt;
    await writeDb(db);

    res.json({
      message: 'Token di recupero generato. Usa il token per impostare una nuova password.',
      recoveryToken,
      expiresAt: tokenExpiresAt
    });
  } catch (error) {
    next(error);
  }
});

router.post('/password-reset/confirm', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const recoveryToken = String(req.body.token || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !recoveryToken || newPassword.length < 8) {
      return next({ status: 400, message: 'Email, token e nuova password di almeno 8 caratteri sono obbligatori' });
    }

    const db = await readDb();
    const user = db.users.find((item) => item.email === email);

    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      return next({ status: 400, message: 'Token di recupero non valido o scaduto' });
    }

    if (Date.parse(user.passwordResetExpiresAt) <= Date.now()) {
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await writeDb(db);
      return next({ status: 400, message: 'Token di recupero non valido o scaduto' });
    }

    const tokenMatches = await bcrypt.compare(recoveryToken, user.passwordResetTokenHash);

    if (!tokenMatches) {
      return next({ status: 400, message: 'Token di recupero non valido o scaduto' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordVersion = Number(user.passwordVersion || 1) + 1;
    user.passwordChangedAt = new Date().toISOString();
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await writeDb(db);

    res.json({
      message: 'Password aggiornata con successo',
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
