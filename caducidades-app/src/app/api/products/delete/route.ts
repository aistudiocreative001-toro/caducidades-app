import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    let products = await readProducts();

    const inicial = products.length;
    products = products.filter((p: any) => !ids.includes(p.id));
    const deleted = inicial - products.length;

    await writeProducts(products);
    return NextResponse.json({ ok: true, deleted });
  } catch (e: any) {
    console.error('API delete error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
