'use client';

import { useState, useEffect } from 'react';
import AppBar from '@/components/layout/AppBar';
import ProductoCard from '@/components/productos/ProductoCard';
import CategoriaCardRecomendada from './CategoriaCardRecomendada';
import { TIENDAS } from '@/types/product';
import type { Product } from '@/types/product';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Sparkles, Printer } from 'lucide-react';
import { generarPDFVentaRecomendada } from '@/lib/pdf';

interface TiendaPageClientProps {
  ubi: string;
}

export default function TiendaPageClient({ ubi }: TiendaPageClientProps) {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoRecomendado, setModoRecomendado] = useState(true); // default a recomendado

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const tienda = TIENDAS.find(t => t.key === ubi);
  if (!tienda) {
    return (
      <div className="text-center py-20 text-[#64748B]">
        Tienda no encontrada
      </div>
    );
  }

  const estadosFinales = ['VENDIDO', 'ROTO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
  const hoy = new Date().toISOString().split('T')[0];

  const activos = productos
    .filter(p => p.ubi === ubi && p.uds > 0 && p.fecha >= hoy && !estadosFinales.includes(p.estado.toUpperCase()))
    .sort((a, b) => a.dias - b.dias);

  // Agrupar por categoría y tomar el más urgente de cada una
  const agrupados: Record<string, Product> = {};
  for (const p of activos) {
    if (!agrupados[p.tipo] || p.dias < agrupados[p.tipo].dias) {
      agrupados[p.tipo] = p;
    }
  }
  const categoriasRecomendadas = Object.values(agrupados).sort((a, b) => a.dias - b.dias);

  if (loading) {
    return (
      <div className="min-h-full flex flex-col">
        <AppBar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full text-center text-[#64748B]">
          Cargando productos...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <AppBar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1565C0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tienda.color }}
            />
            <h1 className="text-2xl font-bold text-[#0F172A]">
              {tienda.nombre} ({ubi})
            </h1>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#64748B]">
            {modoRecomendado
              ? `${categoriasRecomendadas.length} categorías · Venta recomendada del día`
              : `${activos.length} productos · Todos los productos`
            }
          </p>
          <button
            onClick={() => setModoRecomendado(!modoRecomendado)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            {modoRecomendado ? (
              <><LayoutGrid className="w-4 h-4" /> Ver todos</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Venta recomendada</>
            )}
          </button>

          {modoRecomendado && (
            <button
              onClick={() => generarPDFVentaRecomendada(categoriasRecomendadas, ubi)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1565C0] text-sm font-medium text-[#1565C0] hover:bg-[#F0F9FF] transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir listado
            </button>
          )}
        </div>
        
        {activos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
            <p className="text-[#64748B]">No hay productos activos en esta tienda</p>
          </div>
        ) : modoRecomendado ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoriasRecomendadas.map((producto) => (
              <CategoriaCardRecomendada
                key={producto.id}
                categoria={producto.tipo}
                producto={producto}
                esAlmacen={ubi === 'AL'}
                colorTienda={tienda.color}
                onRefresh={fetchProducts}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activos.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                esAlmacen={ubi === 'AL'}
                colorTienda={tienda.color}
                onRefresh={fetchProducts}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
