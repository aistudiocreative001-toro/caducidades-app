'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, ChevronDown } from 'lucide-react';
import { TIENDAS, type TiendaKey } from '@/types/product';
import type { Product } from '@/types/product';
import { getEstadoStyle } from '@/lib/estado-colors';

interface TiendaCardProps {
  tiendaKey: TiendaKey;
  nombre: string;
  color: string;
  productos: Product[];
}

const fmtNumber = (n: number) => n.toLocaleString('es-ES');
const fmtCoste = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TiendaCard({ tiendaKey, nombre, color, productos }: TiendaCardProps) {
  const [mostrarEstados, setMostrarEstados] = useState(false);

  const estadosFinales = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
  const hoy = new Date().toISOString().split('T')[0];

  const activos = productos.filter(p =>
    p.uds > 0 && p.fecha >= hoy && !estadosFinales.includes(p.estado.toUpperCase())
  );

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
      className="relative self-start bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden cursor-pointer"
    >
      <Link href={`/tienda/${encodeURIComponent(tiendaKey)}`} className="block">
        <div className="flex">
          <div className="w-1 shrink-0" style={{ backgroundColor: color }} />

          <div className="flex-1 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: bgColor }}
              >
                <Package className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#0F172A] truncate">{nombre}</h3>
                <p className="text-xs text-[#64748B] font-mono">{tiendaKey}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-2xl font-bold text-[#0F172A]">{fmtNumber(totalUds)}</span>
              <span className="text-xs text-[#64748B]">uds · {fmtCoste(totalCoste)} €</span>
            </div>

            {/* Rangos */}
            <div className="grid grid-cols-2 gap-1.5">
              <RangoMini
                label="Crítico" sub="<10 d"
                count={critico.count} uds={critico.uds} coste={critico.coste}
                color="#DC2626" bg="#FEF2F2"
              />
              <RangoMini
                label="Urgente" sub="10-30 d"
                count={urgente.count} uds={urgente.uds} coste={urgente.coste}
                color="#EA580C" bg="#FFF7ED"
              />
              <RangoMini
                label="Prioritario" sub="30-60 d"
                count={prioritario.count} uds={prioritario.uds} coste={prioritario.coste}
                color="#D97706" bg="#FEF3C7"
              />
              <RangoMini
                label="Vigente" sub="≥60 d"
                count={vigente.count} uds={vigente.uds} coste={vigente.coste}
                color="#1565C0" bg="#DBEAFE"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Desplegable estados finales */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMostrarEstados(!mostrarEstados); }}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border-t border-[#E2E8F0] text-xs text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
      >
        <span>{mostrarEstados ? 'Ocultar estados' : 'Ver más estados'}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${mostrarEstados ? 'rotate-180' : ''}`}
        />
      </button>

      {mostrarEstados && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-4 border-t border-[#E2E8F0]"
        >
          <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 pt-3">
            Estados finales
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {(['CADUCADO','VENDIDO CADUCADO','REGALO CADUCADO','VENDIDO','ROTO','MOVIDO','MOSTRADOR','#N/A'] as const).map(est => {
              const info = get(est);
              if (info.count === 0) return null;
              const estUpper = est === '#N/A' ? '' : est;
              const s = estUpper ? getEstadoStyle(estUpper) : { color: '#CBD5E1', bg: '#F8FAFC' };
              const labels: Record<string, string> = {
                CADUCADO: 'Caducado', 'VENDIDO CADUCADO': 'Vend.Cadu.', 'REGALO CADUCADO': 'Regalo Cadu.',
                VENDIDO: 'Vendido', ROTO: 'Roto', MOVIDO: 'Movido', MOSTRADOR: 'Mostrador', '#N/A': '#N/A',
              };
              return (
                <MiniPill key={est} label={labels[est]} {...info} color={s.color} bg={s.bg} />
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Rango compacto (2x2 grid)
function RangoMini({ label, sub, count, uds, coste, color, bg }: {
  label: string; sub: string; count: number; uds: number; coste: number; color: string; bg: string;
}) {
  const esCero = count === 0;
  const displayColor = esCero ? '#059669' : color;
  const displayBg = esCero ? '#ECFDF5' : bg;
  return (
    <div className="rounded-lg px-2 py-1.5 text-center" style={{ backgroundColor: displayBg }}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span className="text-[10px] font-semibold" style={{ color: displayColor }}>{label}</span>
      </div>
      <p className="text-[10px] leading-tight mb-1" style={{ color: esCero ? undefined : '#94A3B8' }}>
        {esCero ? '✅ 0' : sub}
      </p>
      <p className="text-lg font-bold leading-tight" style={{ color: displayColor }}>{count}</p>
      <p className="text-[10px] text-[#64748B] leading-tight">
        {esCero ? '0 uds' : `${uds} uds · ${fmtCoste(coste)}€`}
      </p>
    </div>
  );
}

// Mini pill para estados finales
function MiniPill({ label, count, uds, coste, color = '#64748B', bg = '#F8FAFC' }: {
  label: string; count: number; uds: number; coste: number; color?: string; bg?: string;
}) {
  if (count === 0) return null;
  return (
    <div className="rounded-md px-1.5 py-1 text-center" style={{ backgroundColor: bg }}>
      <p className="text-[10px] font-medium leading-tight" style={{ color }}>{label}</p>
      <p className="text-sm font-bold leading-tight" style={{ color }}>{count}</p>
      <p className="text-[10px] text-[#94A3B8] leading-tight">{uds} uds · {fmtCoste(coste)}€</p>
    </div>
  );
}

export default TiendaCard;
