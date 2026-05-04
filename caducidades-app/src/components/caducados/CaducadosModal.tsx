'use client';

import { useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/types/product';
import { TIENDAS } from '@/types/product';

interface CaducadosModalProps {
  productos: Product[];
  onAccept: () => void;
}

const fmtMoney = (n: number) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CaducadosModal({ productos, onAccept }: CaducadosModalProps) {
  const [loading, setLoading] = useState(false);
  const [dimissed, setDimissed] = useState(false);

  const totalCoste = productos.reduce((sum, p) => sum + p.costeTotal, 0);

  if (productos.length === 0 || dimissed) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      const ids = productos.map((p) => p.id);
      const res = await fetch('/api/products/caducar-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onAccept();
      setDimissed(true);
    } catch (e) {
      console.error('Error caducando productos:', e);
      alert('Error al guardar cambios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const tiendaColor = (ubi: string) => TIENDAS.find((t) => t.key === ubi)?.color || '#64748B';

  return (
    <AnimatePresence>
      {!dimissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#0B1121]/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.05 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#FEE2E2] bg-[#FEF2F2]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#DC2626] leading-tight">
                    Caducados a fecha ({productos.length})
                  </h2>
                  <p className="text-sm text-[#991B1B] mt-1">
                    Coste total afectado:&nbsp;
                    <span className="font-bold">{fmtMoney(totalCoste)} €</span>
                  </p>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-2">
                {productos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-3 hover:shadow-sm transition-shadow"
                  >
                    {/* Store color strip */}
                    <div
                      className="w-1.5 h-12 rounded-full shrink-0"
                      style={{ backgroundColor: tiendaColor(p.ubi) }}
                    />

                    {/* Icon / UBI badge */}
                    <div className="shrink-0 flex flex-col items-center gap-1 w-10">
                      <Package className="w-5 h-5 text-[#64748B]" />
                      <span className="text-[10px] font-bold text-[#475569]">{p.ubi}</span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">
                        {p.producto || p.observaciones || '(Sin nombre)'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-[#64748B]">
                        <span>
                          <span className="text-[#94A3B8]">Fecha:</span>{' '}
                          <span className="font-medium text-[#475569]">{p.fecha}</span>
                        </span>
                        <span>
                          <span className="text-[#94A3B8]">Coste total:</span>{' '}
                          <span className="font-medium text-[#475569]">
                            {fmtMoney(p.costeTotal)} €
                          </span>
                        </span>
                        {p.marca && p.marca !== '#N/A' && (
                          <span>
                            <span className="text-[#94A3B8]">Marca:</span>{' '}
                            <span className="font-medium text-[#475569]">{p.marca}</span>
                          </span>
                        )}
                        <span>
                          <span className="text-[#94A3B8]">Uds:</span>{' '}
                          <span className="font-medium text-[#475569]">{p.uds}</span>
                        </span>
                      </div>
                    </div>

                    {/* Days badge */}
                    <div className="shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FEE2E2] text-[#DC2626]">
                        {p.dias} d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-[#E2E8F0] bg-[#FAFAFA]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-[#64748B]">
                  Se marcarán como <span className="font-semibold text-[#DC2626]">CADUCADO</span>
                </p>
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#DC2626] text-white rounded-xl text-sm font-semibold hover:bg-[#B91C1C] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading ? 'Guardando…' : '✅ Aceptar y continuar'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
