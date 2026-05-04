import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';
import { calcularDias, calcularFechaMes } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { id, data } = await request.json();
    const products = await readProducts();

    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const producto = products[idx];

    if (data.fecha && data.fecha !== producto.fecha) {
      data.dias = calcularDias(data.fecha);
      data.fechaMes = calcularFechaMes(data.fecha);
    }

    if (data.uds !== undefined || data.coste !== undefined) {
      const uds = data.uds !== undefined ? data.uds : producto.uds;
      const coste = data.coste !== undefined ? data.coste : producto.coste;
      data.costeTotal = uds * coste;
    }

    Object.assign(producto, data);
    await writeProducts(products);
    return NextResponse.json(producto);
  } catch (e: any) {
    console.error('API update error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
