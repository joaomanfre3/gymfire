import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const isVideo = file.type.startsWith('video/');
    const ext = isVideo ? 'webm' : 'jpg';
    const fileName = `drops/drop_${user.id}_${Date.now()}.${ext}`;

    const blob = await put(fileName, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      mediaUrl: blob.url,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    });
  } catch (error) {
    console.error('Upload drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
