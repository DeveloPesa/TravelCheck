import jwt from 'jsonwebtoken';

const fallbackSecret = 'dev-secret-change-me';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, pv: user.passwordVersion || 1 },
    process.env.JWT_SECRET || fallbackSecret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || fallbackSecret);
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}
