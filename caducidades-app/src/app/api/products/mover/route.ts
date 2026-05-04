import { NextRequest, NextResponse } from 'next/server';
import { readProducts, writeProducts } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const { id, destinos }: { id: string; destinos: Record<string, number> } = await request.json();
    const products = await readProducts();

    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const origen = products[idx];
    if (origen.ubi !== 'AL') return NextResponse.json({ error: 'Solo se pueden mover productos del Almacen' }, { status: 400 });

    const totalMovido = (destinos.LR || 0) + (destinos['3C'] || 0) + (destinos.CL || 0);
    if (totalMovido > origen.uds) {
      return NextResponse.json({ error: `No hay suficientes unidades. Disponibles: ${origen.uds}, Intentando mover: ${totalMovido}` }, { status: 400 });
    }
    if (totalMovido === 0) {
      return NextResponse.json({ error: 'Debes mover al menos 1 unidad' }, { status: 400 });
    }

    for (const [ubiDestino, cantidad] of Object.entries(destinos)) {
      if (!cantidad || cantidad <= 0) continue;
      const nuevo = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
        ubi: ubiDestino,
        codigo: origen.codigo,
        sku: origen.sku,
        producto: origen.producto,
        marca: origen.marca,
        tipo: origen.tipo,
        coste: origen.coste,
        uds: cantidad,
        costeTotal: cantidad * origen.coste,
        fecha: origen.fecha,
        fechaMes: origen.fechaMes,
        dias: origen.dias,
        estado: 'VIGENTE',
        observaciones: `Movido desde almacen el ${new Date().toISOString().split('T')[0]}`,
        tags: origen.tags,
      };
      products.push(nuevo);
    }

    origen.uds -= totalMovido;
    origen.costeTotal = origen.uds * origen.coste;
    if (origen.uds === 0) origen.estado = 'MOVIDO';

    await writeProducts(products);
    return new NextResponse(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('API mover error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
