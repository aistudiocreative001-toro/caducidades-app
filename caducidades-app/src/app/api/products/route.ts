import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/products
export async function GET() {
  try {
    const products = await readProducts();
    return new NextResponse(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (e: any) {
    console.error('API GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const products = await request.json();
    await writeProducts(products);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('API POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
