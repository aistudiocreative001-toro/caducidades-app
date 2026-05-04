'use client';

import type { Product } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';
import { TIENDAS } from '@/types/product';

export async function generarPDFVentaRecomendada(
  productos: Product[],
  ubi: string
) {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;

  const tienda = TIENDAS.find(t => t.key === ubi);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Titulo
  doc.setFontSize(18);
  doc.setTextColor(21, 33, 55); // #152337
  doc.text('Listado de Venta Recomendada', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // #64748B
  doc.text(`${tienda?.nombre || ubi} · ${new Date().toLocaleDateString('es-ES')}`, 105, 28, { align: 'center' });

  // Headers table
  autoTable(doc, {
    startY: 35,
    head: [['Categoría', 'Producto', 'Marca', 'Ud.', 'Fecha', 'Días', 'Coste Total']],
    body: productos.map(p => {
      const esCritico = p.dias <= 30;
      const esPrioritario = p.dias > 30 && p.dias <= 60;
      const diasText = `${p.dias}${esCritico ? ' ⚠️' : esPrioritario ? ' ⏰' : ''}`;
      return [
        `${getEmojiCategoria(p.tipo)} ${p.tipo}`,
        p.producto || p.observaciones || '(Sin nombre)',
        p.marca || '',
        String(p.uds),
        p.fecha,
        diasText,
        `${p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
      ];
    }),
    styles: {
      fontSize: 10,
      cellPadding: 4,
      font: 'helvetica',
      textColor: '#152337',
    },
    headStyles: {
      fillColor: tienda ? [parseInt(tienda.color.slice(1, 3), 16), parseInt(tienda.color.slice(3, 5), 16), parseInt(tienda.color.slice(5, 7), 16)] : [21, 101, 192],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 25, halign: 'right' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 5) {
        const diasVal = Number(data.cell.text.replace(/[^\d-]/g, ''));
        if (diasVal <= 30) data.cell.styles.textColor = [220, 38, 38];      // Rojo
        else if (diasVal <= 60) data.cell.styles.textColor = [234, 88, 12]; // Naranja
        else data.cell.styles.textColor = [5, 150, 105];                       // Verde
      }
    },
    margin: { top: 35, left: 14, right: 14 },
  });

  // Totales
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const totalUds = productos.reduce((s, p) => s + p.uds, 0);
  const totalCoste = productos.reduce((s, p) => s + p.costeTotal, 0);

  doc.setFontSize(11);
  doc.setTextColor(21, 33, 55);
  doc.text(`TOTAL: ${totalUds} unidades · ${totalCoste.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, 105, finalY + 10, { align: 'center' });

  doc.save(`venta_recomendada_${ubi.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
}
