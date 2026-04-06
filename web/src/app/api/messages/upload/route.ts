import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine type and extension
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
    const fileName = `msg_${user.id}_${Date.now()}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'chat', subDir);
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, fileName), buffer);

    const mediaUrl = `/uploads/chat/${subDir}/${fileName}`;

    return NextResponse.json({
      mediaUrl,
      mediaType,
      fileName: file.name,
      fileSize: buffer.length,
    });
  } catch (error) {
    console.error('Upload message media error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
