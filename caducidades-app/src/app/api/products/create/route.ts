import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';
import { calcularDias, calcularFechaMes } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const products = await readProducts();

    const dias = calcularDias(data.fecha);
    const fechaMes = calcularFechaMes(data.fecha);

    const nuevoProducto = {
      ...data,
      id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      dias,
      fechaMes,
      costeTotal: data.uds * data.coste,
    };

    products.push(nuevoProducto);
    await writeProducts(products);
    return NextResponse.json(nuevoProducto);
  } catch (e: any) {
    console.error('API create error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
