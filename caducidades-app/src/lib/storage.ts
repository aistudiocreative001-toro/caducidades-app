import fs from 'fs';
import path from 'path';

// En Vercel serverless, solo /tmp es writable
const IS_VERCEL = process.env.VERCEL === '1';
const BUNDLE_FILE = path.resolve(process.cwd(), 'data', 'products.json');
const TMP_FILE = '/tmp/products.json';

export function getLocalContent(): string {
  try {
    // En Vercel: primero leer /tmp (donde guardamos cambios), luego el bundle original
    if (IS_VERCEL) {
      if (fs.existsSync(TMP_FILE)) {
        return fs.readFileSync(TMP_FILE, 'utf-8');
      }
    }
    // Local o fallback: leer del bundle
    if (fs.existsSync(BUNDLE_FILE)) {
      return fs.readFileSync(BUNDLE_FILE, 'utf-8');
    }
  } catch (e) {
    console.error('Error leyendo productos:', e);
  }
  return '[]';
}

export function saveLocalContent(content: string): void {
  try {
    const targetFile = IS_VERCEL ? TMP_FILE : BUNDLE_FILE;
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, content, 'utf-8');
  } catch (e) {
    console.error('Error guardando productos:', e);
    throw new Error('No se pudieron guardar los cambios. Es posible que necesites configurar Vercel Blob para persistencia permanente.');
  }
}
