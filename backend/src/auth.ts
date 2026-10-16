import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest, AuthUser } from './types.js';

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.');
  return value;
};

export function signToken(user: AuthUser): string {
  return jwt.sign(user, secret(), { expiresIn: '1d', issuer: 'lumina-api', audience: 'lumina-web' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  try {
    const decoded = jwt.verify(authorization.slice(7), secret(), {
      issuer: 'lumina-api', audience: 'lumina-web',
    }) as AuthUser;
    if (!decoded.id || !['student', 'admin'].includes(decoded.role)) throw new Error('Token inválido');
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
