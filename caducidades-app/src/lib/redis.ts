import { Redis } from '@upstash/redis';

const CACHE_KEY = 'products:parsed';
const CADUCADOS_KEY_PREFIX = 'caducados:';
const LOCK_KEY = 'lock:caducidades';
const LOCK_TTL = 10;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  try {
    if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  } catch {
    redis = null;
  }
  return redis;
}

export async function getCache(): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get(CACHE_KEY) as string | null;
  } catch {
    return null;
  }
}

export async function setCache(data: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(CACHE_KEY, data, { ex: 300 });
  } catch {}
}

export async function invalidateCache(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(CACHE_KEY);
  } catch {}
}

// Simulación de lock en memoria si no hay Redis
const memoryLock = { locked: false, timeout: null as NodeJS.Timeout | null };

export async function acquireLock(): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    if (memoryLock.locked) return false;
    memoryLock.locked = true;
    memoryLock.timeout = setTimeout(() => {
      memoryLock.locked = false;
    }, LOCK_TTL * 1000);
    return true;
  }
  try {
    const acquired = await r.set(LOCK_KEY, '1', { nx: true, ex: LOCK_TTL });
    return acquired === 'OK';
  } catch {
    return false;
  }
}

export async function releaseLock(): Promise<void> {
  const r = getRedis();
  if (!r) {
    memoryLock.locked = false;
    if (memoryLock.timeout) {
      clearTimeout(memoryLock.timeout);
      memoryLock.timeout = null;
    }
    return;
  }
  try {
    await r.del(LOCK_KEY);
  } catch {}
}

export async function saveCaducadosDeHoy(fecha: string, ids: string[]): Promise<void> {
  const r = getRedis();
  if (!r) {
    // Fallback: usar localStorage del cliente o memoria
    return;
  }
  try {
    await r.set(`${CADUCADOS_KEY_PREFIX}${fecha}`, JSON.stringify(ids));
  } catch {}
}

export async function getCaducadosDeHoy(fecha: string): Promise<string[]> {
  const r = getRedis();
  if (!r) return [];
  try {
    const data = await r.get(`${CADUCADOS_KEY_PREFIX}${fecha}`);
    return data ? JSON.parse(data as string) : [];
  } catch {
    return [];
  }
}

export async function retryWithLock<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    const acquired = await acquireLock();
    if (acquired) {
      try {
        const result = await fn();
        return result;
      } finally {
        await releaseLock();
      }
    }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('No se pudo adquirir el bloqueo. Otro usuario esta editando.');
}
