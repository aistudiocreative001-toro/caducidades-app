import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const { ids }: { ids: string[] } = await request.json();
    if (!ids || ids.length === 0) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    const products = await readProducts();
    let updated = 0;

    for (const id of ids) {
      const p = products.find((prod: any) => prod.id === id);
      if (p && p.estado?.toUpperCase() !== 'CADUCADO') {
        p.estado = 'CADUCADO';
        updated++;
      }
    }

    if (updated > 0) {
      await writeProducts(products);
    }

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    console.error('API caducar-batch error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
