'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/types/product';
import { TIENDAS } from '@/types/product';

interface RankingPodioProps {
  productos: Product[];
}

const fmtNumber = (n: number) => n.toLocaleString('es-ES');
const fmtCoste = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calcDatosTienda(t: typeof TIENDAS[number], productos: Product[], hoy: string, estadosFinales: string[]) {
  const prod = productos.filter(p => p.ubi === t.key);
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

  const penalizacion =
    costeCritico * 4 +
    costeUrgente * 3 +
    costePrioritario * 2 +
    costeRecomendado * 1;

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
    penalizacion,
    puntuacion,
  };
}

function Estrellas({ nivel }: { nivel: number }) {
  // nivel 1-5
  const stars = Array.from({ length: 5 }, (_, i) => i < nivel);
  return (
    <div className="flex items-center justify-center gap-0.5">
      {stars.map((filled, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${filled ? 'text-[#F59E0B]' : 'text-[#E2E8F0]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function RankingPodio({ productos }: RankingPodioProps) {
  const hoy = new Date().toISOString().split('T')[0];
  const estadosFinales = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO', 'CADUCADO'];

  // Tiendas para ranking (excluye AL)
  const tiendas = TIENDAS.filter(t => t.key !== 'AL');
  const datosTiendas = tiendas.map(t => calcDatosTienda(t, productos, hoy, estadosFinales));
  const ranking = [...datosTiendas].sort((a, b) => b.puntuacion - a.puntuacion);

  // Almacén por separado - puntuación en estrellas
  const almacenDef = TIENDAS.find(t => t.key === 'AL');
  const datosAlmacen = almacenDef ? calcDatosTienda(almacenDef, productos, hoy, estadosFinales) : null;

  // Calcular estrellas para AL (invertido: menos penalización = más estrellas)
  let estrellasAL = 5;
  if (datosAlmacen) {
    const { criticoCount, urgenteCount, prioritarioCount, recomendadoCount } = datosAlmacen;
    if (criticoCount > 0) estrellasAL = 1;
    else if (urgenteCount > 0) estrellasAL = 2;
    else if (prioritarioCount > 0) estrellasAL = 3;
    else if (recomendadoCount > 0) estrellasAL = 4;
    else estrellasAL = 5;
  }

  const medallas = ['🥇', '🥈', '🥉'];
  const puestoLabels = ['1º', '2º', '3º'];

  // Estado del almacén como texto
  const estadoAlmacenTexto = !datosAlmacen || datosAlmacen?.totalUds === 0
    ? 'Stock óptimo'
    : datosAlmacen?.criticoCount > 0
    ? 'Crítico: debe mover stock ya'
    : datosAlmacen?.urgenteCount > 0
    ? 'Urgente: mover stock a tiendas'
    : datosAlmacen?.prioritarioCount > 0
    ? 'Prioritario: planificar movimientos'
    : datosAlmacen?.recomendadoCount > 0
    ? 'Recomendado: empezar a mover'
    : 'Stock óptimo';

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
          Menor riesgo &lt;90 días = mejor posición · Penalización: crítico (×4) &gt; urgente (×3) &gt; prioritario (×2) &gt; recomendado (×1) · El Almacén no compite, pero se evalúa con ⭐
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 3 Tiendas + Almacén */}
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

          {/* Almacén - Tarjeta de evaluación con estrellas */}
          {datosAlmacen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', bounce: 0.3 }}
              className={`relative rounded-xl p-3 text-center border ${estrellasAL === 5 ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#E2E8F0] bg-white'}`}
            >
              <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7ED] text-[#D97706]`}>
                📦 Almacén
              </div>

              <div className="mt-2 mb-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: `${datosAlmacen.color}1A` }}>
                  <span className="text-xs font-bold" style={{ color: datosAlmacen.color }}>AL</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] truncate">Almacén</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-center">
                  <Estrellas nivel={estrellasAL} />
                </div>
                <p className="text-[10px] font-semibold text-[#64748B] px-2 leading-tight">
                  {estadoAlmacenTexto}
                </p>
                <p className="text-lg font-bold" style={{ color: datosAlmacen.color }}>
                  {fmtNumber(datosAlmacen.totalUds)}
                  <span className="text-[10px] font-normal text-[#64748B] ml-1">uds &lt;90d</span>
                </p>
                <p className="text-[10px] text-[#64748B]">{fmtCoste(datosAlmacen.totalCoste)} €</p>
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                  {datosAlmacen.criticoCount > 0 && (
                    <span className="text-[10px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded">
                      🔥 {datosAlmacen.criticoCount} crítico{datosAlmacen.criticoCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {datosAlmacen.urgenteCount > 0 && (
                    <span className="text-[10px] font-semibold text-[#EA580C] bg-[#FFF7ED] px-1.5 py-0.5 rounded">
                      ⚠️ {datosAlmacen.urgenteCount} urgente{datosAlmacen.urgenteCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {datosAlmacen.prioritarioCount > 0 && (
                    <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                      📅 {datosAlmacen.prioritarioCount} prioritario{datosAlmacen.prioritarioCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {datosAlmacen.recomendadoCount > 0 && (
                    <span className="text-[10px] font-semibold text-[#06B6D4] bg-[#ECFEFF] px-1.5 py-0.5 rounded">
                      👍 {datosAlmacen.recomendadoCount} recomendado{datosAlmacen.recomendadoCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {datosAlmacen.totalUds === 0 && (
                    <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                      ✅ Stock óptimo
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
