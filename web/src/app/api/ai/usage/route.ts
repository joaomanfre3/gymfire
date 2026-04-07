import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserUsage } from '@/lib/ai';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const usage = await getUserUsage(user.id);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('AI usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
