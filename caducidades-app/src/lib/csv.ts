import Papa from 'papaparse';
import { Product } from '@/types/product';
import { parseCoste, parseFecha, formatFechaISO, calcularFechaMes, calcularDias, calcularEstado } from './utils';

export function parseCSVToProducts(csvContent: string): Product[] {
  // Normalizar saltos de línea
  const normalized = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const lines = normalized.split('\n');
  console.log('[CSV] Total lines:', lines.length);
  
  // Encontrar la línea de encabezados reales
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const upper = lines[i].toUpperCase();
    if (upper.includes('UBI') && upper.includes('CODIGO') && upper.includes('PRODUCTO')) {
      startIdx = i;
      console.log('[CSV] Headers found at line', i + 1, ':', lines[i].substring(0, 50));
      break;
    }
  }
  
  const dataContent = lines.slice(startIdx).join('\n');
  console.log('[CSV] Data content first 200 chars:', dataContent.substring(0, 200));
  
  const result = Papa.parse(dataContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
    dynamicTyping: false,
    // Importante: que Papa.parse maneje correctamente las comillas
    quoteChar: '"',
    escapeChar: '"',
  });
  
  console.log('[CSV] Papa.parse rows:', result.data.length);
  console.log('[CSV] Papa.parse errors:', result.errors.slice(0, 3));
  console.log('[CSV] Papa.parse meta:', result.meta);
  
  if (result.data.length === 0) {
    console.log('[CSV] No data parsed');
    return [];
  }
  
  // Verificar qué campos devolvió Papa
  if (result.data.length > 0) {
    console.log('[CSV] First row keys:', Object.keys(result.data[0] as any));
    console.log('[CSV] First row sample:', JSON.stringify(result.data[0]).substring(0, 200));
  }
  
  const products: Product[] = [];
  let skippedCount = 0;
  
  for (const row of result.data as Record<string, string>[]) {
    const ubi = (row['UBI'] || '').trim();
    const codigo = (row['CODIGO'] || '').trim();
    
    // Skip header repeat, empty rows, or rows without required fields
    if (!ubi || !codigo) {
      skippedCount++;
      continue;
    }
    if (ubi.toUpperCase() === 'UBI') {
      skippedCount++;
      continue;
    }
    
    const fechaStr = row['FECHA'] || '';
    const fechaDate = parseFecha(fechaStr);
    const fechaISO = fechaDate ? formatFechaISO(fechaDate) : '';
    const dias = fechaISO ? calcularDias(fechaISO) : -9999;
    const estadoOriginal = (row['ESTADO'] || '').trim();
    const estado = calcularEstado(dias, estadoOriginal);
    
    const udsRaw = row['UDS'] || '0';
    const uds = parseFloat(udsRaw.toString().replace(/\./g, '').replace(',', '.')) || 0;
    
    const costeRaw = row['COSTE'] || '0';
    const coste = parseCoste(costeRaw);
    
    products.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ubi,
      codigo,
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
  
  console.log('[CSV] Products created:', products.length);
  console.log('[CSV] Skipped rows:', skippedCount);
  
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
