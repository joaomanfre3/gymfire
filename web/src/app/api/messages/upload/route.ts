import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { uploadMedia } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const result = await uploadMedia(file, 'chat');

    return NextResponse.json({
      mediaUrl: result.url,
      mediaType: result.mediaType,
      fileName: file.name,
      fileSize: result.bytes,
    });
  } catch (error) {
    console.error('Upload message media error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
