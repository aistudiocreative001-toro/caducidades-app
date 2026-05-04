'use server';

import { readProducts, writeProducts } from '@/lib/blob-storage';
import type { Product } from '@/types/product';

function recalcularProducto(p: Product): Product {
  const { calcularDias } = require('@/lib/utils');
  const dias = calcularDias(p.fecha);
  return {
    ...p,
    dias,
    costeTotal: p.uds * p.coste,
  };
}

export async function getProducts(): Promise<Product[]> {
  const productos = await readProducts();
  return productos.map(recalcularProducto);
}

export async function getProductsByUbi(ubi: string): Promise<Record<string, Product[]>> {
  const productos = await getProducts();

  const estadosFinales = ['VENDIDO', 'ROTO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
  const hoy = new Date().toISOString().split('T')[0];

  const filtrados = productos.filter(p => {
    return p.ubi === ubi &&
           p.uds > 0 &&
           p.fecha >= hoy &&
           !estadosFinales.includes(p.estado.toUpperCase());
  });

  const agrupados: Record<string, Product[]> = {};
  for (const p of filtrados) {
    if (!agrupados[p.tipo]) agrupados[p.tipo] = [];
    agrupados[p.tipo].push(p);
  }

  for (const tipo in agrupados) {
    agrupados[tipo].sort((a, b) => a.dias - b.dias);
  }

  return agrupados;
}
