import { NextRequest, NextResponse } from 'next/server';
import { writeProducts } from '@/lib/blob-storage';
import { parseCSVToProducts } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('[IMPORT] Body length:', body.length);
    console.log('[IMPORT] Body first 200 chars:', body.substring(0, 200));
    
    const products = parseCSVToProducts(body);
    console.log('[IMPORT] Parsed products:', products.length);
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No se encontraron productos válidos en el CSV' }, { status: 400 });
    }

    await writeProducts(products);
    return NextResponse.json({ ok: true, count: products.length });
  } catch (e: any) {
    console.error('[IMPORT] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
