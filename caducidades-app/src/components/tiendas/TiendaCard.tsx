'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, ChevronDown } from 'lucide-react';
import { TIENDAS, type TiendaKey } from '@/types/product';
import type { Product } from '@/types/product';

interface TiendaCardProps {
  tiendaKey: TiendaKey;
  nombre: string;
  color: string;
  productos: Product[];
}

const fmtNumber = (n: number) => n.toLocaleString('es-ES');
const fmtCoste = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Colores para rangos de días
const RANGO_STYLE: Record<string, { bg: string; text: string; emoji: string }> = {
  'critico': { bg: '#FEF2F2', text: '#DC2626', emoji: '🔥' },
  'urgente': { bg: '#FFF7ED', text: '#EA580C', emoji: '⚠️' },
  'prioritario': { bg: '#FEF3C7', text: '#D97706', emoji: '📅' },
  'vigente': { bg: '#ECFDF5', text: '#059669', emoji: '✅' },
};

function TiendaCard({ tiendaKey, nombre, color, productos }: TiendaCardProps) {
  const [mostrarEstados, setMostrarEstados] = useState(false);

  const estadosFinales = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
  const hoy = new Date().toISOString().split('T')[0];

  // Activos = uds > 0, fecha >= hoy, no estado final (incluye VIGENTE y MOSTRADOR)
  const activos = productos.filter(p =>
    p.uds > 0 && p.fecha >= hoy && !estadosFinales.includes(p.estado.toUpperCase())
  );

  // Rangos de días (sobre activos; CADUCADO queda fuera por fecha < hoy o estado)
  const criticoList = activos.filter(p => p.dias != null && p.dias >= 0 && p.dias < 10);
  const urgenteList = activos.filter(p => p.dias != null && p.dias >= 10 && p.dias < 30);
  const prioritarioList = activos.filter(p => p.dias != null && p.dias >= 30 && p.dias < 60);
  const vigenteList = activos.filter(p => p.dias != null && p.dias >= 60);

  const makeMetrics = (list: Product[]) => ({
    count: list.length,
    uds: list.reduce((s, p) => s + p.uds, 0),
    coste: list.reduce((s, p) => s + p.costeTotal, 0),
  });

  const critico = makeMetrics(criticoList);
  const urgente = makeMetrics(urgenteList);
  const prioritario = makeMetrics(prioritarioList);
  const vigente = makeMetrics(vigenteList);

  // Estados finales + CADUCADO + MOSTRADOR + #N/A
  const estadosDesplegable = ['CADUCADO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'VENDIDO', 'ROTO', 'MOVIDO', 'MOSTRADOR', '#N/A'];
  const grupos: Record<string, { count: number; uds: number; coste: number }> = {};
  for (const p of productos) {
    const e = p.estado.toUpperCase();
    if (!estadosDesplegable.includes(e) && e !== '') continue;
    const key = e || '#N/A';
    if (!grupos[key]) grupos[key] = { count: 0, uds: 0, coste: 0 };
    grupos[key].count++;
    grupos[key].uds += p.uds;
    grupos[key].coste += p.costeTotal;
  }

  const get = (est: string) => grupos[est.toUpperCase()] || { count: 0, uds: 0, coste: 0 };

  const totalUds = activos.reduce((s, p) => s + p.uds, 0);
  const totalCoste = critico.coste + urgente.coste + prioritario.coste + vigente.coste;

  const bgColor = `${color}1A`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.3 }}
      className="relative self-start bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden cursor-pointer"
    >
      <Link href={`/tienda/${encodeURIComponent(tiendaKey)}`} className="block">
        <div className="flex">
          <div className="w-1.5 shrink-0" style={{ backgroundColor: color }} />

          <div className="flex-1 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: bgColor }}
              >
                <Package className="w-7 h-7" style={{ color }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-[#0F172A] truncate">{nombre}</h3>
                <p className="text-sm text-[#64748B] font-mono">{tiendaKey}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold text-[#0F172A]">{fmtNumber(totalUds)}</span>
              <span className="text-base text-[#64748B]">uds activas · {fmtCoste(totalCoste)} €</span>
            </div>

            {/* Rangos CRÍTICO / URGENTE / PRIORITARIO / VIGENTE */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <RangoPill
                emoji="🔥" label="Crítico" sub="< 10 días"
                count={critico.count} uds={critico.uds} coste={critico.coste}
                color="#DC2626" bg="#FEF2F2"
              />
              <RangoPill
                emoji="⚠️" label="Urgente" sub="10-30 días"
                count={urgente.count} uds={urgente.uds} coste={urgente.coste}
                color="#EA580C" bg="#FFF7ED"
              />
              <RangoPill
                emoji="📅" label="Prioritario" sub="30-60 días"
                count={prioritario.count} uds={prioritario.uds} coste={prioritario.coste}
                color="#D97706" bg="#FEF3C7"
              />
              <RangoPill
                emoji="✅" label="Vigente" sub="≥ 60 días"
                count={vigente.count} uds={vigente.uds} coste={vigente.coste}
                color="#059669" bg="#ECFDF5"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Desplegable de estados finales */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMostrarEstados(!mostrarEstados); }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 border-t border-[#E2E8F0] text-sm text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
      >
        <span>{mostrarEstados ? 'Ocultar estados' : 'Ver más estados'}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${mostrarEstados ? 'rotate-180' : ''}`}
        />
      </button>

      {mostrarEstados && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-6 pb-6 border-t border-[#E2E8F0]"
        >
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 pt-4">
            Estados finales
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <MiniPill emoji="🔴" label="Caducado" {...get('CADUCADO')} color="#DC2626" bg="#FEE2E2" />
            <MiniPill emoji="💸" label="Vend. Cadu." {...get('VENDIDO CADUCADO')} color="#B91C1C" bg="#FEF2F2" />
            <MiniPill emoji="🎁" label="Regalo Cadu." {...get('REGALO CADUCADO')} color="#D97706" bg="#FFF7ED" />
            <MiniPill emoji="💰" label="Vendido" {...get('VENDIDO')} color="#047857" bg="#D1FAE5" />
            <MiniPill emoji="🗑️" label="Roto" {...get('ROTO')} color="#EF4444" bg="#FFF1F2" />
            <MiniPill emoji="🚚" label="Movido" {...get('MOVIDO')} color="#4F46E5" bg="#E0E7FF" />
            <MiniPill emoji="🪟" label="Mostrador" {...get('MOSTRADOR')} color="#475569" bg="#F1F5F9" />
            <MiniPill emoji="❓" label="#N/A" {...get('#N/A')} color="#CBD5E1" bg="#F8FAFC" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Componente para rango de días (grande)
function RangoPill({ emoji, label, sub, count, uds, coste, color, bg }: {
  emoji: string; label: string; sub: string; count: number; uds: number; coste: number; color: string; bg: string;
}) {
  const esCero = count === 0;
  const displayColor = esCero ? '#059669' : color;
  const displayBg = esCero ? '#ECFDF5' : bg;
  return (
    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: displayBg }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: displayColor }}>
        {emoji} {label}
      </p>
      <p className="text-xs mb-2" style={{ color: esCero ? undefined : '#94A3B8' }}>
        {esCero ? '🏆 Excelente' : sub}
      </p>
      <p className="text-2xl font-bold" style={{ color: displayColor }}>{count}</p>
      <p className="text-xs text-[#64748B]">
        {esCero ? '0 uds · 0,00 €' : `${uds} uds · ${fmtCoste(coste)} €`}
      </p>
    </div>
  );
}

// Mini pill para estados finales
function MiniPill({ emoji, label, count, uds, coste, color = '#64748B', bg = '#F8FAFC' }: {
  emoji: string; label: string; count: number; uds: number; coste: number; color?: string; bg?: string;
}) {
  if (count === 0) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-center" style={{ backgroundColor: bg }}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{count}</p>
      <p className="text-xs text-[#94A3B8]">{fmtCoste(coste)} €</p>
    </div>
  );
}

export default TiendaCard;
