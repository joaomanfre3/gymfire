import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { uploadMedia } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const result = await uploadMedia(file, folder);

    return NextResponse.json({
      url: result.url,
      mediaUrl: result.url,
      mediaType: result.mediaType,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
