import { getAuthPayload } from './auth';
import { prisma } from './prisma';

export async function getAdminUser(request: Request) {
  const payload = getAuthPayload(request);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export function adminUnauthorized() {
  return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
}
