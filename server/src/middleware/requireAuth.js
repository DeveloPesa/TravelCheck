import { verifyToken } from '../utils/auth.js';
import { readDb } from '../services/database.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next({ status: 401, message: 'Accesso richiesto' });
  }

  try {
    const payload = verifyToken(token);
    const db = await readDb();
    const user = db.users.find((item) => item.id === payload.sub);

    if (!user || (user.passwordVersion || 1) !== (payload.pv || 1)) {
      return next({ status: 401, message: 'Sessione non valida o scaduta' });
    }

    req.user = payload;
    req.userRecord = user;
    return next();
  } catch {
    return next({ status: 401, message: 'Sessione non valida o scaduta' });
  }
}
