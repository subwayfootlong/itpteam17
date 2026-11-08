import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Each session gets its own ID (jti) so logging out can revoke just that session
// (see lib/sessionPolicy.ts and app/api/auth/logout).
export function createAccessToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d', jwtid: randomUUID() });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET as string);
}
