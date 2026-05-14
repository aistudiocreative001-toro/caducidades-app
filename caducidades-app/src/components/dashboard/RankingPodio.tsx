'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/types/product';
import { TIENDAS } from '@/types/product';

interface RankingPodioProps {
  productos: Product[];
}

const fmtNumber = (n: number) => n.toLocaleString('es-ES');
const fmtCoste = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RankingPodio({ productos }: RankingPodioProps) {
  const hoy = new Date().toISOString().split('T')[0];
  const estadosFinales = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO', 'CADUCADO'];

  // Excluir Almacén (AL)
  const tiendas = TIENDAS.filter(t => t.key !== 'AL');

  const datos = tiendas.map(t => {
    const prod = productos.filter(p => p.ubi === t.key);
    // Solo productos < 90 días y no en estados finales
    const riesgo = prod.filter(p =>
      p.uds > 0 &&
      p.fecha >= hoy &&
      !estadosFinales.includes(p.estado.toUpperCase()) &&
      p.dias != null && p.dias >= 0 && p.dias < 90
    );

    const critico = riesgo.filter(p => p.dias < 10);
    const urgente = riesgo.filter(p => p.dias >= 10 && p.dias < 30);
    const prioritario = riesgo.filter(p => p.dias >= 30 && p.dias < 60);
    const recomendado = riesgo.filter(p => p.dias >= 60 && p.dias < 90);

    const costeCritico = critico.reduce((s, p) => s + p.costeTotal, 0);
    const costeUrgente = urgente.reduce((s, p) => s + p.costeTotal, 0);
    const costePrioritario = prioritario.reduce((s, p) => s + p.costeTotal, 0);
    const costeRecomendado = recomendado.reduce((s, p) => s + p.costeTotal, 0);

    const totalUds = riesgo.reduce((s, p) => s + p.uds, 0);
    const totalCoste = riesgo.reduce((s, p) => s + p.costeTotal, 0);

    // Puntuación: MENOS productos de riesgo = MEJOR
    // Penalización por coste: crítico (x4) > urgente (x3) > prioritario (x2) > recomendado (x1)
    const penalizacion =
      costeCritico * 4 +
      costeUrgente * 3 +
      costePrioritario * 2 +
      costeRecomendado * 1;

    // Puntuación base alta, penalización la reduce
    // Cuanto menor la puntuación, mejor ranking
    const puntuacion = 100000 - penalizacion - (totalUds * 10);

    return {
      key: t.key,
      nombre: t.nombre,
      color: t.color,
      totalUds,
      totalCoste,
      criticoCount: critico.length,
      urgenteCount: urgente.length,
      prioritarioCount: prioritario.length,
      recomendadoCount: recomendado.length,
      puntuacion,
    };
  });

  // Ordenar por puntuación descendente (mayor puntuación = menos riesgo = mejor)
  const ranking = [...datos].sort((a, b) => b.puntuacion - a.puntuacion);

  const medallas = ['🥇', '🥈', '🥉'];
  const puestoLabels = ['1º', '2º', '3º'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mb-6"
    >
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🏆</span>
          <h2 className="text-base font-bold text-[#0F172A]">Ranking de Tiendas</h2>
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">
          Menor riesgo &lt;90 días = mejor posición · Penalización: crítico (×4) &gt; urgente (×3) &gt; prioritario (×2) &gt; recomendado (×1)
        </p>

        <div className="grid grid-cols-3 gap-3">
          {ranking.map((t, i) => {
            const isPrimero = i === 0;
            const bgColor = `${t.color}1A`;
            return (
              <motion.div
                key={t.key}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * i, type: 'spring', bounce: 0.3 }}
                className={`relative rounded-xl p-3 text-center border ${isPrimero ? 'border-[#F59E0B] bg-[#FFFBEB]' : 'border-[#E2E8F0] bg-white'}`}
              >
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPrimero ? 'bg-[#F59E0B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {medallas[i]} {puestoLabels[i]}
                </div>

                <div className="mt-2 mb-1.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: bgColor }}>
                    <span className="text-xs font-bold" style={{ color: t.color }}>{t.key}</span>
                  </div>
                  <p className="text-sm font-bold text-[#0F172A] truncate">{t.nombre}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-bold" style={{ color: t.color }}>
                    {fmtNumber(t.totalUds)}
                    <span className="text-[10px] font-normal text-[#64748B] ml-1">uds &lt;90d</span>
                  </p>
                  <p className="text-[10px] text-[#64748B]">{fmtCoste(t.totalCoste)} €</p>
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                    {t.criticoCount > 0 && (
                      <span className="text-[10px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded">
                        🔥 {t.criticoCount} crítico{t.criticoCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {t.urgenteCount > 0 && (
                      <span className="text-[10px] font-semibold text-[#EA580C] bg-[#FFF7ED] px-1.5 py-0.5 rounded">
                        ⚠️ {t.urgenteCount} urgente{t.urgenteCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {t.prioritarioCount > 0 && (
                      <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                        📅 {t.prioritarioCount} prioritario{t.prioritarioCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {t.recomendadoCount > 0 && (
                      <span className="text-[10px] font-semibold text-[#06B6D4] bg-[#ECFEFF] px-1.5 py-0.5 rounded">
                        👍 {t.recomendadoCount} recomendado{t.recomendadoCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {t.criticoCount === 0 && t.urgenteCount === 0 && t.prioritarioCount === 0 && t.recomendadoCount === 0 && (
                      <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                        ✅ Sin riesgo &lt;90d
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
