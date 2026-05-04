import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const { id, cantidad } = await request.json();
    const products = await readProducts();

    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const producto = products[idx];
    if (cantidad > producto.uds) {
      return NextResponse.json({ error: `No hay suficientes unidades. Disponibles: ${producto.uds}` }, { status: 400 });
    }

    producto.uds -= cantidad;
    producto.costeTotal = producto.uds * producto.coste;
    if (producto.uds === 0) producto.estado = 'VENDIDO';

    await writeProducts(products);
    return new NextResponse(JSON.stringify({ ok: true, product: producto }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('API vender error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
