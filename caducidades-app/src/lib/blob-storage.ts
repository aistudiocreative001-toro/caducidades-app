import { put, list } from '@vercel/blob';
import { calcularDias } from './utils';

const BLOB_PREFIX = 'products-';

function recalcularProducto(p: any): any {
  if (p.fecha && typeof p.fecha === 'string' && p.fecha.trim() !== '' && p.fecha !== '#N/A') {
    p.dias = calcularDias(p.fecha);
  } else {
    p.dias = null; // Sin fecha, no mostrar nums invalidos
  }
  if (typeof p.uds === 'number' && typeof p.coste === 'number') {
    p.costeTotal = p.uds * p.coste;
  }
  return p;
}

export async function readProducts() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN no configurado');

  const { blobs } = await list({ prefix: BLOB_PREFIX, token });
  if (blobs.length === 0) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.resolve(process.cwd(), 'data', 'products.json');
      if (fs.existsSync(localPath)) {
        const data = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
        return data.map(recalcularProducto);
      }
    } catch {}
    return [];
  }

  const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const latest = sorted[0];

  const res = await fetch(latest.url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch latest blob: ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(recalcularProducto);
}

export async function writeProducts(products: any[]) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN no configurado');

  const json = JSON.stringify(products, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const timestamp = Date.now();
  const pathname = `${BLOB_PREFIX}${timestamp}.json`;

  await put(pathname, blob, {
    access: 'public',
    contentType: 'application/json',
    token,
  });

  // Clean up old blobs (keep only last 10)
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX, token });
    const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    if (sorted.length > 10) {
      const { del } = await import('@vercel/blob');
      const toDelete = sorted.slice(10);
      for (const b of toDelete) {
        await del(b.url, { token });
      }
    }
  } catch (e) {
    console.warn('Error cleaning up old blobs:', e);
  }

  return pathname;
}
