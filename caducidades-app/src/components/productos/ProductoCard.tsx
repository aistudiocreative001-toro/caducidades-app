'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';
import { getEstadoStyle } from '@/lib/estado-colors';

interface ProductoCardProps {
  producto: Product;
  esAlmacen: boolean;
  colorTienda: string;
  onRefresh?: () => void;
}

export default function ProductoCard({
  producto: p,
  esAlmacen,
  colorTienda,
  onRefresh,
}: ProductoCardProps) {
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moverDestinos, setMoverDestinos] = useState({ LR: 0, '3C': 0, CL: 0 });
  const [showMoverModal, setShowMoverModal] = useState(false);

  const diasNum = p.dias;

  // Color de urgencia
  let urgenciaColor = '#43A047';
  if (diasNum <= 30) urgenciaColor = '#E53935';
  else if (diasNum <= 60) urgenciaColor = '#FB8C00';
  else if (diasNum <= 90) urgenciaColor = '#FBC02D';

  // Badge de estado / urgencia
  const getUrgenciaLabel = () => {
    if (esAlmacen) {
      if (diasNum <= 30) return 'URGENTE';
      if (diasNum <= 60) return 'PRIORITARIO';
      if (diasNum <= 90) return 'RECOMENDADO';
      return 'PROGRAMAR';
    }
    return p.estado;
  };

  const getUrgenciaBg = () => {
    if (esAlmacen) {
      if (diasNum <= 30) return '#FEE2E2';
      if (diasNum <= 60) return '#FFF7ED';
      if (diasNum <= 90) return '#ECFEFF';
      return '#FEF3C7';
    }
    return getEstadoStyle(p.estado).bg;
  };

  const getUrgenciaText = () => {
    if (esAlmacen) {
      if (diasNum <= 30) return '#DC2626';
      if (diasNum <= 60) return '#EA580C';
      if (diasNum <= 90) return '#06B6D4';
      return '#D97706';
    }
    return getEstadoStyle(p.estado).color;
  };

  const handleVender = async () => {
    if (cantidad <= 0 || cantidad > p.uds) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, cantidad }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al vender');
      onRefresh?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al vender');
    } finally {
      setLoading(false);
    }
  };

  const handleMover = async () => {
    const total = Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0);
    if (total <= 0 || total > p.uds) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, destinos: moverDestinos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al mover');
      setShowMoverModal(false);
      onRefresh?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al mover');
    } finally {
      setLoading(false);
    }
  };

  // Helpers para fallback a observaciones
  const isNA = (val: string) => !val || val === '#N/A' || val.trim() === '';
  const categoriaDisplay = isNA(p.tipo) && p.observaciones ? p.observaciones : p.tipo;
  const productoDisplay = isNA(p.producto) && p.observaciones ? p.observaciones : p.producto;
  // Si marca es #N/A o vacío, mostrar observaciones en su lugar
  const marcaDisplay = isNA(p.marca) && p.observaciones ? p.observaciones : p.marca;

  // Fondo rojo cuando el producto tiene pocos días (< 60) y fecha válida
  const esCritico = p.dias != null && p.dias !== -9999 && p.dias < 60;
  const cardBgColor = esCritico ? '#FEF2F2' : '#FFFFFF';
  const borderTopColor = esCritico ? '#DC2626' : (esAlmacen ? urgenciaColor : colorTienda);
  const totalMovido = Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-full"
        style={{ backgroundColor: cardBgColor }}
      >
        {/* Top accent bar */}
        <div className="h-1.5" style={{ backgroundColor: borderTopColor }} />

        <div className="p-4 flex flex-col flex-1">
          {/* Header: Categoría + Estado */}
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-[#64748B]">
              {isNA(p.tipo) ? '' : getEmojiCategoria(p.tipo)} {categoriaDisplay}
            </span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: getUrgenciaBg(),
                color: getUrgenciaText(),
              }}
            >
              {getUrgenciaLabel()}
            </span>
          </div>

          {/* Marca / Observaciones */}
          <p className="text-xs text-[#94A3B8] mb-1">{isNA(p.marca) ? p.observaciones || '' : marcaDisplay}</p>

          {/* Nombre producto */}
          <h3 className="font-bold text-sm text-[#0F172A] leading-tight mb-3 line-clamp-2">
            {productoDisplay}
          </h3>

          {/* Info key */}
          <div className="text-xs text-[#0F172A] mb-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Unidades</span>
              <span className="font-bold">{p.uds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Caducidad</span>
              <span>{p.fecha}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Días</span>
              <span
                className={`font-bold ${
                  p.dias <= 30 ? 'text-[#DC2626]' : p.dias <= 60 ? 'text-[#EA580C]' : 'text-[#059669]'
                }`}
              >
                {p.dias}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Coste</span>
              <span className="font-semibold">{p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>

          {/* Observaciones icon */}
          <div className="mb-2">
            {p.observaciones && p.observaciones.trim() !== '' && p.observaciones !== '#N/A' ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#1565C0] cursor-help" title={p.observaciones}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate max-w-[200px]">{p.observaciones}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-[#CBD5E1]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Sin observaciones</span>
              </span>
            )}
          </div>

          {/* Action area */}
          {!esAlmacen ? (
            <div className="mt-auto pt-3 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#E2E8F0] rounded-lg h-8 flex-1">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="px-2 hover:bg-[#F1F5F9] rounded-l-lg h-full flex items-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={p.uds}
                    value={cantidad}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setCantidad(Math.min(Math.max(1, v), p.uds));
                    }}
                    className="w-full text-center text-sm border-x border-[#E2E8F0] h-full focus:outline-none"
                  />
                  <button
                    onClick={() => setCantidad(Math.min(p.uds, cantidad + 1))}
                    className="px-2 hover:bg-[#F1F5F9] rounded-r-lg h-full flex items-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={handleVender}
                  disabled={loading || cantidad > p.uds}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50 h-8 shrink-0"
                  style={{ backgroundColor: colorTienda }}
                >
                  <ShoppingCart className="w-3 h-3" />
                  {loading ? '...' : 'Vender'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-auto pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowMoverModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium h-8"
                style={{ backgroundColor: '#FB8C00' }}
              >
                <Truck className="w-3 h-3" />
                Mover
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Mover */}
      {showMoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !loading && setShowMoverModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FB8C00]" />
                Mover producto
              </h2>
              <button
                onClick={() => !loading && setShowMoverModal(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >✕</button>
            </div>
            
            <div className="mb-4 bg-[#F8FAFC] rounded-lg p-3">
              <p className="font-medium text-[#0F172A]">{productoDisplay}</p>
              <p className="text-sm text-[#64748B]">
                Almacén · {p.uds} unidades · {p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
            </div>
            
            <p className="text-sm font-medium text-[#0F172A] mb-3">Destinos:</p>
            
            <div className="space-y-3 mb-4">
              {(['LR', '3C', 'CL'] as const).map((tienda) => (
                <div key={tienda} className="flex items-center justify-between">
                  <span className="text-sm text-[#0F172A] w-8 font-medium">{tienda}</span>
                  <div className="flex items-center border border-[#E2E8F0] rounded-lg">
                    <button
                      onClick={() => setMoverDestinos(prev => ({
                        ...prev,
                        [tienda]: Math.max(0, (prev[tienda] || 0) - 1)
                      }))}
                      className="px-3 py-2 hover:bg-[#F1F5F9] rounded-l-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={p.uds}
                      value={moverDestinos[tienda] || 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setMoverDestinos(prev => ({
                          ...prev,
                          [tienda]: Math.min(Math.max(0, v), p.uds)
                        }));
                      }}
                      className="w-16 text-center text-sm border-x border-[#E2E8F0] py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setMoverDestinos(prev => ({
                        ...prev,
                        [tienda]: Math.min(p.uds, (prev[tienda] || 0) + 1)
                      }))}
                      className="px-3 py-2 hover:bg-[#F1F5F9] rounded-r-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`text-sm mb-4 ${totalMovido > p.uds ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
              Total a mover: {totalMovido} / {p.uds} unidades
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowMoverModal(false)}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleMover}
                disabled={loading || totalMovido === 0 || totalMovido > p.uds}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#FB8C00' }}
              >
                {loading ? 'Moviendo...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
