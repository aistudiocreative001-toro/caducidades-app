import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

const BLOB_PREFIX = 'products-';

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('BLOB_READ_WRITE_TOKEN no configurado');

    const { blobs } = await list({ prefix: BLOB_PREFIX, token });
    const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    const backups = sorted.slice(0, 10).map(b => ({
      url: b.url,
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
      size: b.size,
    }));

    return NextResponse.json({ backups });
  } catch (e: any) {
    console.error('[BACKUPS LIST] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
