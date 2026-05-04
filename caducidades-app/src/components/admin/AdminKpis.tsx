'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/types/product';
import { CheckCircle2, AlertTriangle, Clock, Trash2, ShoppingCart, Gift, Archive, BarChart3 } from 'lucide-react';

const estadoConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  VIGENTE: { label: 'VIGENTE', color: '#1565C0', bg: '#DBEAFE', icon: <CheckCircle2 className="w-4 h-4" /> },
  'EN RIESGO': { label: 'PRÓXIMO', color: '#EA580C', bg: '#FFF7ED', icon: <AlertTriangle className="w-4 h-4" /> },
  CADUCADO: { label: 'CADUCADO', color: '#DC2626', bg: '#FEF2F2', icon: <Clock className="w-4 h-4" /> },
  ROTO: { label: 'ROTO', color: '#D97706', bg: '#FEF3C7', icon: <Trash2 className="w-4 h-4" /> },
  VENDIDO: { label: 'VENDIDO', color: '#475569', bg: '#F1F5F9', icon: <ShoppingCart className="w-4 h-4" /> },
  'VENDIDO CADUCADO': { label: 'VEND. CADU.', color: '#10B981', bg: '#D1FAE5', icon: <ShoppingCart className="w-4 h-4" /> },
  'REGALO CADUCADO': { label: 'REGALO C.', color: '#BE185D', bg: '#FCE7F3', icon: <Gift className="w-4 h-4" /> },
  MOVIDO: { label: 'MOVIDO', color: '#4F46E5', bg: '#E0E7FF', icon: <Archive className="w-4 h-4" /> },
  MOSTRADOR: { label: 'MOSTRADOR', color: '#0284C7', bg: '#E0F2FE', icon: <BarChart3 className="w-4 h-4" /> },
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
        const config = estadoConfig[estado] || { label: estado, color: '#64748B', bg: '#F1F5F9', icon: null };
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
                style={{ backgroundColor: config.bg, color: config.color }}
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
