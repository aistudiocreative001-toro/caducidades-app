'use client';

import { useState, useEffect } from 'react';
import AppBar from '@/components/layout/AppBar';
import ProductoCard from '@/components/productos/ProductoCard';
import CategoriaCardRecomendada from './CategoriaCardRecomendada';
import { TIENDAS } from '@/types/product';
import type { Product } from '@/types/product';
import Link from 'next/link';
import { ArrowLeft, Grid3X3, Sparkles, Printer, FolderKanban, Tag } from 'lucide-react';
import { generarPDFVentaRecomendada } from '@/lib/pdf';

interface TiendaPageClientProps {
  ubi: string;
}

export default function TiendaPageClient({ ubi }: TiendaPageClientProps) {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'recomendada' | 'todos' | 'categoria'>('recomendada');

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

  // Agrupar por categoría para recomendada y porCategoria
  const agrupados: Record<string, Product> = {};
  const porCategoria: Record<string, Product[]> = {};
  for (const p of activos) {
    const tipoKey = p.tipo?.trim() || 'Sin categoría';
    // recomendada: el más urgente por categoría
    if (!agrupados[tipoKey] || p.dias < agrupados[tipoKey].dias) {
      agrupados[tipoKey] = p;
    }
    // por categoria
    if (!porCategoria[tipoKey]) porCategoria[tipoKey] = [];
    porCategoria[tipoKey].push(p);
  }
  const categoriasRecomendadas = Object.values(agrupados).sort((a, b) => a.dias - b.dias);

  // Ordenar categorías por su producto más urgente
  Object.values(porCategoria).forEach(list => list.sort((a, b) => a.dias - b.dias));
  const categoriasOrdenadas = Object.entries(porCategoria).sort((a, b) => {
    const diasA = a[1][0]?.dias ?? Infinity;
    const diasB = b[1][0]?.dias ?? Infinity;
    return diasA - diasB;
  });

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

  const recomendadaLabel = ubi === 'AL' ? 'Movimientos recomendados' : 'Venta recomendada';

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
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tienda.color }} />
            <h1 className="text-2xl font-bold text-[#0F172A]">
              {tienda.nombre} ({ubi})
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <p className="text-sm text-[#64748B]">
            {vista === 'recomendada'
              ? `${categoriasRecomendadas.length} categorías · ${recomendadaLabel} del día`
              : vista === 'categoria'
              ? `${Object.keys(porCategoria).length} categorías · Todos los productos agrupados`
              : `${activos.length} productos · Todos los productos`
            }
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setVista('recomendada')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                vista === 'recomendada'
                  ? 'bg-[#1565C0] text-white border-[#1565C0]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              <Sparkles className="w-4 h-4" /> {recomendadaLabel}
            </button>
            <button
              onClick={() => setVista('todos')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                vista === 'todos'
                  ? 'bg-[#1565C0] text-white border-[#1565C0]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              <Grid3X3 className="w-4 h-4" /> Ver todos
            </button>
            <button
              onClick={() => setVista('categoria')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                vista === 'categoria'
                  ? 'bg-[#1565C0] text-white border-[#1565C0]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              <FolderKanban className="w-4 h-4" /> Por categoría
            </button>
            {vista === 'recomendada' && categoriasRecomendadas.length > 0 && (
              <button
                onClick={() => {
                  generarPDFVentaRecomendada(
                    categoriasRecomendadas,
                    ubi === 'AL' ? 'Listado de Movimientos Recomendados' : 'Listado de Venta Recomendada',
                    `${tienda.nombre || ubi}`
                  );
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1565C0] text-sm font-medium text-[#1565C0] hover:bg-[#F0F9FF] transition-colors"
              >
                <Printer className="w-4 h-4" /> Imprimir listado
              </button>
            )}
          </div>
        </div>

        {activos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
            <p className="text-[#64748B]">No hay productos activos en esta tienda</p>
          </div>
        ) : vista === 'recomendada' ? (
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
        ) : vista === 'todos' ? (
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
        ) : (
          <div className="space-y-8">
            {categoriasOrdenadas.map(([nombreCat, productosCat]) => {
              const masUrgente = productosCat[0];

              return (
                <div key={nombreCat} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E2E8F0]">
                    <Tag className="w-5 h-5 text-[#64748B]" />
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-[#0F172A]">{nombreCat}</h2>
                      <p className="text-xs text-[#64748B]">
                        {productosCat.length} producto{productosCat.length > 1 ? 's' : ''} ·
                        Más urgente: {masUrgente.dias} días
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {productosCat.map((producto) => (
                      <ProductoCard
                        key={producto.id}
                        producto={producto}
                        esAlmacen={ubi === 'AL'}
                        colorTienda={tienda.color}
                        onRefresh={fetchProducts}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
