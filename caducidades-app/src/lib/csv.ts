import Papa from 'papaparse';
import { Product } from '@/types/product';
import { parseFecha, formatFechaISO, calcularFechaMes, calcularDias } from './utils';

// Normaliza EANs que Excel haya convertido a notación científica (ej: 5,99908E+12)
function cleanEAN(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d+,\d+[eE][+-]?\d+$/.test(trimmed)) {
    const normalized = trimmed.replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? String(Math.round(num)) : trimmed;
  }
  // Si Excel exportó como número puro sin notación científica, devolver tal cual
  return trimmed;
}

// Parsea números en formato español (coma decimal) o inglés (punto decimal) de forma segura
function parseSpanishNumber(val: string): number {
  if (!val) return 0;
  let v = val.trim();
  if (!v) return 0;
  // Ambos separadores (miles + decimal): 1.234,56 => 1234.56
  if (v.includes(',') && v.includes('.')) {
    return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Solo coma decimal: 35,44 => 35.44
  if (v.includes(',')) {
    return parseFloat(v.replace(',', '.')) || 0;
  }
  // Solo punto: asumir decimal (nuestro export no usa punto de miles para costes)
  return parseFloat(v) || 0;
}

export function parseCSVToProducts(csvContent: string): Product[] {
  const text = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!text) return [];

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
  });

  console.log('[CSV] Papa.parse rows:', result.data.length);
  console.log('[CSV] Papa.parse errors:', result.errors.slice(0, 5));
  if (result.data.length > 0) {
    console.log('[CSV] First row keys:', Object.keys(result.data[0]));
    console.log('[CSV] First row:', JSON.stringify(result.data[0]).substring(0, 300));
  }

  if (result.data.length === 0) return [];

  const products: Product[] = [];

  for (const row of result.data) {
    const ubi = (row['ubi'] || row['UBI'] || '').trim();
    const codigo = cleanEAN((row['codigo'] || row['CODIGO'] || '').trim());
    if (!ubi || !codigo) continue;

    const fechaStr = (row['fecha'] || row['FECHA'] || '').trim();
    const fechaDate = parseFecha(fechaStr);
    const fechaISO = fechaDate ? formatFechaISO(fechaDate) : '';

    let dias: number | null = null;
    if (fechaISO) {
      const raw = calcularDias(fechaISO);
      dias = raw === -9999 ? null : raw;
    }

    const estado = ((row['estado'] || row['ESTADO'] || '').trim() || 'VIGENTE').toUpperCase();

    const uds = parseSpanishNumber(row['uds'] || row['UDS'] || '0');
    const coste = parseSpanishNumber(row['coste'] || row['COSTE'] || '0');

    const id = (row['id'] || row['ID'] || '').trim();
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    products.push({
      id: id || uuid,
      ubi,
      codigo,
      sku: cleanEAN((row['sku'] || row['SKU'] || '').trim()),
      producto: (row['producto'] || row['PRODUCTO'] || '').trim(),
      marca: (row['marca'] || row['MARCA'] || '').trim(),
      tipo: (row['tipo'] || row['TIPO'] || '').trim(),
      coste,
      uds,
      costeTotal: uds * coste,
      fecha: fechaISO,
      fechaMes: fechaISO ? calcularFechaMes(fechaISO) : '',
      dias: dias === null ? -9999 : dias,
      estado,
      observaciones: (row['observaciones'] || row['OBSERVACIONES'] || '').trim(),
      tags: (row['tags'] || row['TAGS'] || '').trim(),
    });
  }

  console.log('[CSV] Products created:', products.length);
  return products;
}

function csvEscape(val: string): string {
  if (val.includes(';') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function productsToCSV(products: Product[]): string {
  const headers = ['id','ubi','codigo','sku','producto','marca','tipo','coste','uds','costeTotal','fecha','fechaMes','dias','estado','observaciones','tags'];
  const rows = products.map(p => [
    p.id,
    csvEscape(p.ubi),
    csvEscape(p.codigo),
    csvEscape(p.sku),
    csvEscape(p.producto),
    csvEscape(p.marca),
    csvEscape(p.tipo),
    String(p.coste).replace('.', ','),
    String(p.uds).replace('.', ','),
    String(p.costeTotal).replace('.', ','),
    p.fecha,
    p.fechaMes,
    p.dias === null ? '' : String(p.dias),
    p.estado,
    csvEscape(p.observaciones),
    csvEscape(p.tags),
  ]);
  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}
