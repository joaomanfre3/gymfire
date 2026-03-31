import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
  }
}

const jwtSecret = JWT_SECRET || 'dev-secret-do-not-use-in-production';
const jwtRefreshSecret = JWT_REFRESH_SECRET || 'dev-refresh-secret-do-not-use-in-production';

export async function hashPassword(password: string): Promise<string> {
  // Truncate to 72 bytes (bcrypt limit)
  const truncated = password.slice(0, 72);
  return bcrypt.hash(truncated, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const truncated = plain.slice(0, 72);
  return bcrypt.compare(truncated, hash);
}

export function createAccessToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, jwtSecret, { expiresIn: '15m' });
}

export function createRefreshToken(userId: string): string {
  return jwt.sign({ userId }, jwtRefreshSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): { userId: string; username: string } | null {
  try {
    return jwt.verify(token, jwtSecret) as { userId: string; username: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, jwtRefreshSecret) as { userId: string };
  } catch {
    return null;
  }
}

export function getAuthPayload(request: Request): { userId: string; username: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return verifyAccessToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    return user;
  } catch {
    return null;
  }
}
