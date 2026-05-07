'use client';

import { useState } from 'react';
import { X, RotateCcw, History, Package, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/types/product';
import { TIENDAS } from '@/types/product';
import { getEstadoStyle } from '@/lib/estado-colors';

export interface HistoryItem {
  id: string;
  timestamp: string;
  producto: Product;
  action: string;
  changes: { field: string; before: string; after: string }[];
  fullBefore?: Product | null; // snapshot before change, for full restore
}

interface HistorialSesionProps {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function HistorialSesion({ open, onClose, history, onRestore, onClear }: HistorialSesionProps) {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <History className="w-5 h-5 text-[#1565C0]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Historial de Sesión</h2>
                  <p className="text-sm text-[#64748B]">{history.length} cambios registrados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button
                    onClick={onClear}
                    className="px-3 py-1.5 text-xs text-[#DC2626] border border-[#FEE2E2] rounded-lg hover:bg-[#FEF2F2]"
                  >
                    Limpiar historial
                  </button>
                )}
                <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {history.length === 0 ? (
                <div className="text-center py-12 text-[#64748B]">
                  <History className="w-12 h-12 mx-auto mb-3 text-[#CBD5E1]" />
                  <p className="text-sm">No hay cambios registrados en esta sesión</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Las acciones que realices (vender, mover, editar, etc.) aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                        selectedItem?.id === item.id
                          ? 'border-[#1565C0] bg-[#F0F9FF]'
                          : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                      }`}
                      onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: TIENDAS.find(t => t.key === item.producto.ubi)?.color || '#ccc' }}
                          />
                          <div>
                            <p className="font-semibold text-sm text-[#0F172A]">
                              {item.producto.producto || item.producto.observaciones || '(Sin nombre)'}
                            </p>
                            <p className="text-xs text-[#64748B]">
                              {item.producto.ubi} · {item.producto.marca} · {item.producto.tipo} · {formatTime(item.timestamp)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#DBEAFE] text-[#1565C0]">
                          {item.action}
                        </span>
                      </div>

                      {/* Changes table */}
                      {item.changes.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[#64748B] border-b border-[#E2E8F0]">
                                <th className="text-left py-1 px-2 font-medium">Campo</th>
                                <th className="text-left py-1 px-2 font-medium">Antes</th>
                                <th className="text-left py-1 px-2 font-medium">Después</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.changes.map((c, idx) => (
                                <tr key={idx} className="border-b border-[#F1F5F9] last:border-b-0">
                                  <td className="py-1.5 px-2 text-[#475569] font-medium">{c.field}</td>
                                  <td className="py-1.5 px-2 text-[#DC2626]">{c.before}</td>
                                  <td className="py-1.5 px-2 text-[#059669]">{c.after}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Current state summary */}
                      <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                        <span><strong>Ubicación:</strong> {item.producto.ubi}</span>
                        <span><strong>Uds:</strong> {item.producto.uds}</span>
                        <span><strong>Coste:</strong> {item.producto.costeTotal.toFixed(2)} €</span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: getEstadoStyle(item.producto.estado).bg, color: getEstadoStyle(item.producto.estado).color }}
                        >
                          {item.producto.estado}
                        </span>
                        {item.producto.observaciones && (
                          <span className="text-[#94A3B8] truncate max-w-[200px]" title={item.producto.observaciones}>
                            Obs: {item.producto.observaciones}
                          </span>
                        )}
                      </div>

                      {/* Restore button */}
                      {selectedItem?.id === item.id && item.fullBefore && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestore(item);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1565C0] text-white rounded-lg text-sm font-medium hover:bg-[#0D47A1]"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restaurar a estado anterior
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
