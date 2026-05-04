'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, ShoppingCart, Minus, Plus } from 'lucide-react';
import type { Product } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';
import { getEstadoStyle } from '@/lib/estado-colors';

interface CategoriaCardProps {
  categoria: string;
  producto: Product;
  esAlmacen: boolean;
  colorTienda: string;
  onRefresh?: () => void;
}

export default function CategoriaCard({
  categoria,
  producto: p,
  esAlmacen,
  colorTienda,
  onRefresh,
}: CategoriaCardProps) {
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moverDestinos, setMoverDestinos] = useState({ LR: 0, '3C': 0, CL: 0 });
  const [showMoverModal, setShowMoverModal] = useState(false);

  const diasNum = p.dias;

  let urgenciaColor = '#43A047';
  if (diasNum <= 30) urgenciaColor = '#E53935';
  else if (diasNum <= 60) urgenciaColor = '#FB8C00';
  else if (diasNum <= 90) urgenciaColor = '#FBC02D';

  const getUrgenciaLabel = () => {
    if (esAlmacen) {
      if (diasNum <= 30) return 'URGENTE';
      if (diasNum <= 60) return 'PRIORITARIO';
      return 'PROGRAMAR';
    }
    return p.estado;
  };

  const getUrgenciaBg = () => {
    if (esAlmacen) {
      if (diasNum <= 30) return '#FEE2E2';
      if (diasNum <= 60) return '#FFF7ED';
      return '#FEF3C7';
    }
    return getEstadoStyle(p.estado).bg;
  };

  const getUrgenciaText = () => {
    if (esAlmacen) {
      if (diasNum <= 30) return '#DC2626';
      if (diasNum <= 60) return '#EA580C';
      return '#D97706';
    }
    return getEstadoStyle(p.estado).color;
  };

  // Helpers para fallback a observaciones cuando campos son #N/A o vacíos
  const isNA = (val: string) => !val || val === '#N/A' || val.trim() === '';
  const categoriaDisplay = isNA(categoria) && p.observaciones ? p.observaciones : categoria;
  const productoDisplay = isNA(p.producto) && p.observaciones ? p.observaciones : p.producto;
  const marcaDisplay = isNA(p.marca) && p.observaciones ? p.observaciones : p.marca;
  const tipoDisplay = isNA(p.tipo) && p.observaciones ? p.observaciones : p.tipo;

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

  const totalMovido = Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0);

  const borderColor = esAlmacen ? urgenciaColor : colorTienda;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
      >
        <div className="h-1.5" style={{ backgroundColor: borderColor }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#0F172A] truncate">
              {isNA(categoria) ? '' : getEmojiCategoria(categoria)} {categoriaDisplay}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded shrink-0 ml-2"
              style={{
                backgroundColor: getUrgenciaBg(),
                color: getUrgenciaText(),
              }}
            >
              {getUrgenciaLabel()}
            </span>
          </div>
          
          <div className="text-sm text-[#64748B] mb-1 truncate">
            {p.ubi} · {marcaDisplay} · {tipoDisplay}
          </div>
          <div className="font-semibold text-lg text-[#0F172A] mb-3 line-clamp-2">
            {productoDisplay}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#0F172A] mb-4">
            <span><strong>{p.uds}</strong> uds</span>
            <span>{p.fecha}</span>
            <span
              className={`font-semibold ${
                p.dias <= 30 ? 'text-[#DC2626]' : p.dias <= 60 ? 'text-[#EA580C]' : 'text-[#059669]'
              }`}
            >
              {p.dias} días
            </span>
            <span className="font-semibold">
              {p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </span>
          </div>
          
          {!esAlmacen ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#E2E8F0] rounded-lg">
                <button
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="px-2 py-1 hover:bg-[#F1F5F9] rounded-l-lg"
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
                  className="w-12 text-center text-sm border-x border-[#E2E8F0] py-1 focus:outline-none"
                />
                <button
                  onClick={() => setCantidad(Math.min(p.uds, cantidad + 1))}
                  className="px-2 py-1 hover:bg-[#F1F5F9] rounded-r-lg"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              
              <button
                onClick={handleVender}
                disabled={loading || cantidad > p.uds}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: colorTienda }}
              >
                <ShoppingCart className="w-4 h-4" />
                {loading ? '...' : 'Vender'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMoverModal(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#FB8C00' }}
            >
              <Truck className="w-4 h-4" />
              Mover
            </button>
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
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
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
