import { NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const products = await readProducts();
    const pathname = await writeProducts(products);
    return NextResponse.json({ ok: true, pathname, count: products.length });
  } catch (e: any) {
    console.error('[BACKUP] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
