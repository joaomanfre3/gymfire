import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { computeExportRect } from './cropMath';
import type { CropResult } from './types';

export async function exportCrop(params: {
  uri: string;
  Iw: number; Ih: number;
  Fw: number; Fh: number;
  scale: number; tx: number; ty: number;
  outputWidth?: number;
  quality?: number;
}): Promise<CropResult> {
  const outW = params.outputWidth ?? 1080;
  const rect = computeExportRect(params);

  console.log('EXPORT DEBUG:', {
    Fw: params.Fw, Fh: params.Fh,
    Iw: params.Iw, Ih: params.Ih,
    scale: params.scale, tx: params.tx, ty: params.ty,
    rect,
  });

  try {
    const result = await manipulateAsync(
      params.uri,
      [
        { crop: rect },
        { resize: { width: outW } },
      ],
      {
        compress: params.quality ?? 0.92,
        format: SaveFormat.JPEG,
      },
    );

    console.log('EXPORT RESULT:', result.uri, result.width, result.height);
    return { uri: result.uri, width: result.width, height: result.height };
  } catch (e) {
    console.error('[exportCrop] manipulateAsync failed:', e);
    throw new Error(`Falha ao exportar recorte: ${(e as any)?.message}`);
  }
}
