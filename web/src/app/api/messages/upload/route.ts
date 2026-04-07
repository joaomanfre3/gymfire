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

    const mimeType = file.type;
    let subDir = 'files';
    let mediaType = 'IMAGE';

    if (mimeType.startsWith('image/')) {
      subDir = 'images';
      mediaType = 'IMAGE';
    } else if (mimeType.startsWith('video/')) {
      subDir = 'videos';
      mediaType = 'VIDEO';
    } else if (mimeType.startsWith('audio/')) {
      subDir = 'audio';
      mediaType = 'AUDIO';
    }

    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `chat/${subDir}/msg_${user.id}_${Date.now()}.${ext}`;

    const blob = await put(fileName, file, {
      access: 'public',
      contentType: mimeType,
    });

    return NextResponse.json({
      mediaUrl: blob.url,
      mediaType,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Upload message media error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
