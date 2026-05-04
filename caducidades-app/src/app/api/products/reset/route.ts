import { NextRequest, NextResponse } from 'next/server';
import { writeProducts } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (password !== 'admin') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 });
    }

    // Escribir un array vacío — borra toda la base de datos
    await writeProducts([]);
    return NextResponse.json({ ok: true, message: 'Base de datos reseteada' });
  } catch (e: any) {
    console.error('API reset error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
