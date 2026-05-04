import Papa from 'papaparse';
import { Product } from '@/types/product';
import { parseCoste, parseFecha, formatFechaISO, calcularFechaMes, calcularDias, calcularEstado } from './utils';

export function parseCSVToProducts(csvContent: string): Product[] {
  const lines = csvContent.split('\n');
  
  // Encontrar la línea de encabezados reales
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes('UBI') && lines[i].includes('CODIGO') && lines[i].includes('PRODUCTO')) {
      startIdx = i;
      break;
    }
  }
  
  const dataContent = lines.slice(startIdx).join('\n');
  
  const result = Papa.parse(dataContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
    dynamicTyping: false,
  });
  
  const products: Product[] = [];
  
  for (const row of result.data as Record<string, string>[]) {
    if (!row['UBI'] || !row['CODIGO']) continue;
    if (row['UBI'].toUpperCase() === 'UBI') continue;
    
    const fechaStr = row['FECHA'] || '';
    const fechaDate = parseFecha(fechaStr);
    const fechaISO = fechaDate ? formatFechaISO(fechaDate) : '';
    const dias = fechaISO ? calcularDias(fechaISO) : -9999;
    const estadoOriginal = (row['ESTADO'] || '').trim();
    const estado = calcularEstado(dias, estadoOriginal);
    
    const uds = parseFloat(row['UDS']) || 0;
    const coste = parseCoste(row['COSTE']);
    
    products.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ubi: (row['UBI'] || '').trim(),
      codigo: (row['CODIGO'] || '').trim(),
      sku: (row['SKU'] || '').trim(),
      producto: (row['PRODUCTO'] || '').trim(),
      marca: (row['MARCA'] || '').trim(),
      tipo: (row['TIPO'] || '').trim(),
      coste,
      uds,
      costeTotal: uds * coste,
      fecha: fechaISO,
      fechaMes: fechaISO ? calcularFechaMes(fechaISO) : '',
      dias,
      estado,
      observaciones: (row['OBSERVACIONES'] || '').trim(),
      tags: (row['TAGS'] || '').trim(),
    });
  }
  
  return products;
}

export function productsToCSV(products: Product[]): string {
  const headers = ['id','ubi','codigo','sku','producto','marca','tipo','coste','uds','costeTotal','fecha','fechaMes','dias','estado','observaciones','tags'];
  
  const rows = products.map(p => [
    p.id,
    p.ubi,
    p.codigo,
    p.sku,
    `"${p.producto.replace(/"/g, '""')}"`,
    p.marca,
    p.tipo,
    String(p.coste).replace('.', ','),
    String(p.uds).replace('.', ','),
    String(p.costeTotal).replace('.', ','),
    p.fecha,
    p.fechaMes,
    String(p.dias),
    p.estado,
    `"${p.observaciones.replace(/"/g, '""')}"`,
    `"${p.tags.replace(/"/g, '""')}"`,
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
