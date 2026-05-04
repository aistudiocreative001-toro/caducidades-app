'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/types/product';
import { CheckCircle2, AlertTriangle, Clock, Trash2, ShoppingCart, Gift, Archive, BarChart3 } from 'lucide-react';

import { getEstadoStyle } from '@/lib/estado-colors';

const estadoConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  VIGENTE: { label: 'VIGENTE', icon: <CheckCircle2 className="w-4 h-4" /> },
  'EN RIESGO': { label: 'PRÓXIMO', icon: <AlertTriangle className="w-4 h-4" /> },
  CADUCADO: { label: 'CADUCADO', icon: <Clock className="w-4 h-4" /> },
  ROTO: { label: 'ROTO', icon: <Trash2 className="w-4 h-4" /> },
  VENDIDO: { label: 'VENDIDO', icon: <ShoppingCart className="w-4 h-4" /> },
  'VENDIDO CADUCADO': { label: 'VEND. CADU.', icon: <ShoppingCart className="w-4 h-4" /> },
  'REGALO CADUCADO': { label: 'REGALO C.', icon: <Gift className="w-4 h-4" /> },
  MOVIDO: { label: 'MOVIDO', icon: <Archive className="w-4 h-4" /> },
  MOSTRADOR: { label: 'MOSTRADOR', icon: <BarChart3 className="w-4 h-4" /> },
};

interface AdminKpisProps {
  productos: Product[];
}

export default function AdminKpis({ productos }: AdminKpisProps) {
  // Agrupar por estado
  const porEstado: Record<string, Product[]> = {};
  for (const p of productos) {
    if (!porEstado[p.estado]) porEstado[p.estado] = [];
    porEstado[p.estado].push(p);
  }

  const estados = Object.keys(porEstado).sort();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
      {estados.map((estado, i) => {
        const config = estadoConfig[estado] || { label: estado, icon: null };
        const estilo = getEstadoStyle(estado);
        const items = porEstado[estado];
        const totalUds = items.reduce((s, p) => s + p.uds, 0);
        const totalCoste = items.reduce((s, p) => s + p.costeTotal, 0);

        return (
          <motion.div
            key={estado}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: estilo.bg, color: estilo.color }}
              >
                {config.icon}
                {config.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{totalUds}</p>
            <p className="text-xs text-[#64748B]">{totalCoste.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
          </motion.div>
        );
      })}
    </div>
  );
}
