import { ItemLista } from "../interfaces/notion.interface";

interface CacheEntry {
  data: ItemLista[];
  timestamp: number;
}

// Cache en memoria
const cache: Map<string, CacheEntry> = new Map();

// TTL de 60 minutos en milisegundos
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Verifica si una entrada de caché es válida (no ha expirado)
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  const age = now - entry.timestamp;
  return age < CACHE_TTL_MS;
}

/**
 * Obtiene datos del caché si existen y son válidos
 */
export function getFromCache(key: string): ItemLista[] | null {
  const entry = cache.get(key);

  if (!entry) {
    console.log(`[Cache] MISS - No existe caché para: ${key}`);
    return null;
  }

  if (!isCacheValid(entry)) {
    const ageMinutes = Math.round((Date.now() - entry.timestamp) / 1000 / 60);
    console.log(
      `[Cache] EXPIRED - Caché de ${key} tiene ${ageMinutes} minutos (máx: 60)`,
    );
    return null;
  }

  const ageMinutes = Math.round((Date.now() - entry.timestamp) / 1000 / 60);
  console.log(
    `[Cache] HIT - Sirviendo ${key} desde caché (edad: ${ageMinutes} min)`,
  );
  return entry.data;
}

/**
 * Guarda datos en el caché
 */
export function saveToCache(key: string, data: ItemLista[]): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
  console.log(
    `[Cache] SAVE - Guardado ${key} con ${data.length} items en caché`,
  );
}

/**
 * Invalida una entrada específica del caché
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
  console.log(`[Cache] INVALIDATE - Eliminado ${key} del caché`);
}

/**
 * Invalida todo el caché
 */
export function clearCache(): void {
  cache.clear();
  console.log(`[Cache] CLEAR - Caché completamente limpiado`);
}

/**
 * Obtiene estadísticas del caché
 */
export function getCacheStats(): {
  entries: number;
  keys: string[];
  details: { key: string; ageMinutes: number; itemCount: number }[];
} {
  const details = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    ageMinutes: Math.round((Date.now() - entry.timestamp) / 1000 / 60),
    itemCount: entry.data.length,
  }));

  return {
    entries: cache.size,
    keys: Array.from(cache.keys()),
    details,
  };
}
