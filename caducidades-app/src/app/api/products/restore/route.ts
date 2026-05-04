import { NextRequest, NextResponse } from 'next/server';
import { writeProducts } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url, password } = await request.json();
    if (password !== 'admin') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 });
    }
    if (!url) {
      return NextResponse.json({ error: 'No se proporcionó URL de backup' }, { status: 400 });
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Error al descargar backup: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('El backup no contiene productos válidos');

    await writeProducts(data);
    return NextResponse.json({ ok: true, count: data.length });
  } catch (e: any) {
    console.error('[RESTORE] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
