import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { id: string; estado: string }[] = body.items || [];
    const ids: string[] = body.ids || [];

    const products = await readProducts();
    let updated = 0;

    // Modo individual: [{id, estado}]
    if (items.length > 0) {
      for (const { id, estado } of items) {
        const p = products.find((prod: any) => prod.id === id);
        if (p && p.estado !== estado) {
          p.estado = estado;
          updated++;
        }
      }
    }
    // Modo batch legacy: [ids]
    else if (ids.length > 0) {
      for (const id of ids) {
        const p = products.find((prod: any) => prod.id === id);
        if (p && p.estado?.toUpperCase() !== 'CADUCADO') {
          p.estado = 'CADUCADO';
          updated++;
        }
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
