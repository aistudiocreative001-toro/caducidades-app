import fs from 'fs';
import path from 'path';
import { parseCSVToProducts, productsToCSV } from '../src/lib/csv';
import { saveBlobContent } from '../src/lib/blob';

async function migrate() {
  try {
    const csvPath = path.resolve(process.cwd(), '..', 'CADUCIDADES hasta 09_26 incluido - Caducidades.csv');
    console.log('Leyendo CSV:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('ERROR: No se encontró el archivo CSV en:', csvPath);
      console.log('Buscando en alternativa...');
      const altPath = path.resolve(process.cwd(), 'CADUCIDADES hasta 09_26 incluido - Caducidades.csv');
      if (fs.existsSync(altPath)) {
        console.log('Encontrado en:', altPath);
        const content = fs.readFileSync(altPath, 'utf-8');
        processCSV(content);
      } else {
        console.error('No encontrado. Coloca el CSV en la carpeta raíz del proyecto.');
        process.exit(1);
      }
    } else {
      const content = fs.readFileSync(csvPath, 'utf-8');
      await processCSV(content);
    }
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
}

async function processCSV(content: string) {
  console.log('Parseando productos...');
  const products = parseCSVToProducts(content);
  console.log(`Total productos parseados: ${products.length}`);
  
  const csvOutput = productsToCSV(products);
  console.log('Subiendo a Vercel Blob...');
  await saveBlobContent(csvOutput);
  console.log('✅ Migración completada exitosamente!');
}

migrate();
