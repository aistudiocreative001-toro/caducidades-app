import { NextRequest, NextResponse } from 'next/server';
import { writeProducts } from '@/lib/blob-storage';
import { parseCSVToProducts } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const products = parseCSVToProducts(body);
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No se encontraron productos válidos en el CSV' }, { status: 400 });
    }

    await writeProducts(products);
    return NextResponse.json({ ok: true, count: products.length });
  } catch (e: any) {
    console.error('API import error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
