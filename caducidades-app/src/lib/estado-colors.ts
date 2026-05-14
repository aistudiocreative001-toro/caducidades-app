export const ESTADO_COLOR: Record<string, { color: string; bg: string }> = {
  VIGENTE:             { color: '#1565C0', bg: '#DBEAFE' }, // azul
  'EN RIESGO':         { color: '#EA580C', bg: '#FFF7ED' }, // naranja
  RECOMENDADO:         { color: '#06B6D4', bg: '#ECFEFF' }, // cyan
  CADUCADO:            { color: '#DC2626', bg: '#FEF2F2' }, // rojo fuerte
  ROTO:                { color: '#EF4444', bg: '#FFF1F2' }, // rojo suave
  VENDIDO:             { color: '#047857', bg: '#D1FAE5' }, // verde fuerte
  'VENDIDO CADUCADO':  { color: '#10B981', bg: '#D1FAE5' }, // verde claro
  'REGALO CADUCADO':   { color: '#D97706', bg: '#FFF7ED' }, // naranja
  MOVIDO:              { color: '#4F46E5', bg: '#E0E7FF' }, // azul índigo
  MOSTRADOR:           { color: '#475569', bg: '#F1F5F9' }, // gris
};

export function getEstadoStyle(estado: string) {
  return ESTADO_COLOR[estado] || { color: '#64748B', bg: '#F1F5F9' };
}
