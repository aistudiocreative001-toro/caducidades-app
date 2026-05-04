import { put, list } from '@vercel/blob';
import { getLocalContent, saveLocalContent } from './storage';

const BLOB_KEY = 'caducidades.csv';

export async function getBlobContent(): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  // Si no hay token de Vercel Blob, usar almacenamiento local
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN no definido. Usando almacenamiento local.');
    return getLocalContent();
  }
  
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length === 0) {
      console.warn('No se encontró el archivo en Blob. Usando datos locales.');
      return getLocalContent();
    }
    const url = blobs[0].url;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error leyendo Blob: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error leyendo Blob:', error);
    return getLocalContent();
  }
}

export async function saveBlobContent(content: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN no definido. Guardando en almacenamiento local.');
    saveLocalContent(content);
    return;
  }
  
  try {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    await put(BLOB_KEY, blob, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/csv;charset=utf-8',
    });
  } catch (error) {
    console.error('Error escribiendo Blob:', error);
    // Fallback local
    saveLocalContent(content);
  }
}
