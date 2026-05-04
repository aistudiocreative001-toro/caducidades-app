'use client';

import type { Product } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';

const ESTADO_EMOJI: Record<string, string> = {
  VIGENTE: '🟦',
  'EN RIESGO': '🟧',
  CADUCADO: '🟥',
  ROTO: '🔴',
  VENDIDO: '🟩',
  'VENDIDO CADUCADO': '🟢',
  'REGALO CADUCADO': '🟡',
  MOVIDO: '🔵',
  MOSTRADOR: '⬜',
};

export function generarPDFVentaRecomendada(
  productos: Product[],
  titulo = 'Listado de Venta Recomendada',
  subtitulo = ''
) {
  const fecha = new Date().toLocaleDateString('es-ES');

  const rows = productos.map(p => {
    const emojiEstado = ESTADO_EMOJI[p.estado] || '';
    return `
      <tr>
        <td class="cell">${getEmojiCategoria(p.tipo)} ${p.tipo}</td>
        <td class="cell">${p.producto || p.observaciones || '(Sin nombre)'}</td>
        <td class="cell">${p.marca || ''}</td>
        <td class="cell center">${p.uds}</td>
        <td class="cell">${p.fecha}</td>
        <td class="cell center" style="color:${p.dias <= 30 ? '#DC2626' : p.dias <= 60 ? '#EA580C' : '#059669'};font-weight:bold;">${p.dias}</td>
        <td class="cell right">${p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
        <td class="cell">${emojiEstado} ${p.estado}</td>
        <td class="cell">${p.ubi}</td>
      </tr>
    `;
  }).join('');

  const totalUds = productos.reduce((s, p) => s + p.uds, 0);
  const totalCoste = productos.reduce((s, p) => s + p.costeTotal, 0);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <style>
    body { font-family: sans-serif; margin: 24px; color: #152337; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 13px; text-align: center; color: #64748B; font-weight: normal; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1565C0; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
    .cell { padding: 5px 8px; border-bottom: 1px solid #E2E8F0; }
    .center { text-align: center; }
    .right { text-align: right; }
    .totals { margin-top: 12px; text-align: center; font-weight: bold; font-size: 13px; }
    tr:nth-child(even) { background: #F8FAFC; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>🛒 ${titulo}</h1>
  <h2>${subtitulo ? subtitulo + ' · ' : ''}${fecha}</h2>
  <table>
    <thead>
      <tr>
        <th>Categoría</th>
        <th>Producto</th>
        <th>Marca</th>
        <th class="center">Ud.</th>
        <th>Fecha</th>
        <th class="center">Días</th>
        <th class="right">Coste</th>
        <th>Estado</th>
        <th>UBI</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="totals">TOTAL: ${totalUds} unidades · ${totalCoste.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  } else {
    alert('Permite ventanas emergentes para imprimir el listado');
  }
}
