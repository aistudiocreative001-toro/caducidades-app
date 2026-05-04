const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvPath = path.resolve(process.cwd(), '..', 'CADUCIDADES hasta 09_26 incluido - Caducidades.csv');

if (!fs.existsSync(csvPath)) {
  console.error('CSV no encontrado:', csvPath);
  process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

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
});

function parseCoste(valor) {
  if (!valor) return 0;
  const limpio = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(limpio) || 0;
}

function parseFecha(fechaStr) {
  if (!fechaStr) return '';
  const match = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, dia, mes, anio] = match;
    return `${anio}-${mes}-${dia}`;
  }
  return fechaStr;
}

function calcularFechaMes(fechaISO) {
  const fecha = new Date(fechaISO + 'T00:00:00');
  if (isNaN(fecha.getTime())) return '';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[fecha.getMonth()]}-${fecha.getFullYear()}`;
}

function calcularDias(fechaISO) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaISO + 'T00:00:00');
  if (isNaN(fecha.getTime())) return -9999;
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function calcularEstado(dias, estadoActual) {
  // Respetar el estado del CSV tal cual, no forzar CADUCADO
  return estadoActual || 'VIGENTE';
}

const products = [];
for (const row of result.data) {
  if (!row['UBI'] || !row['CODIGO'] || row['UBI'].toUpperCase() === 'UBI') continue;
  
  const fechaISO = parseFecha(row['FECHA'] || '');
  const dias = fechaISO ? calcularDias(fechaISO) : -9999;
  const estadoOriginal = (row['ESTADO'] || '').trim();
  const estado = calcularEstado(dias, estadoOriginal);
  const uds = parseFloat(row['UDS']) || 0;
  const coste = parseCoste(row['COSTE']);
  
  products.push({
    id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}-${products.length}`,
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

const outputDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(
  path.join(outputDir, 'products.json'),
  JSON.stringify(products, null, 2)
);

console.log(`✅ ${products.length} productos exportados a data/products.json`);
