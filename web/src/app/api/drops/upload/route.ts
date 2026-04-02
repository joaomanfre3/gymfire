import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST - upload media file for drop
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine media type
    const isVideo = file.type.startsWith('video/');
    const ext = isVideo ? 'mp4' : 'jpg';
    const fileName = `drop_${user.id}_${Date.now()}.${ext}`;

    // Save to public/uploads/drops
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'drops');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, fileName), buffer);

    const mediaUrl = `/uploads/drops/${fileName}`;

    return NextResponse.json({
      mediaUrl,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    });
  } catch (error) {
    console.error('Upload drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
