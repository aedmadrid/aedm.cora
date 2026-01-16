import { ItemLista } from "../interfaces/notion.interface";
import { NotionPageResponse } from "../interfaces/notionPage.interface";

// Tipos soportados por el caché
type CacheData = ItemLista[] | NotionPageResponse;

interface CacheEntry<T = CacheData> {
  data: T;
  timestamp: number;
  type: "lista" | "page";
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
 * Obtiene datos del caché si existen y son válidos (para listas)
 */
export function getFromCache(key: string): ItemLista[] | null {
  const entry = cache.get(key);

  if (!entry) {
    console.log(`[Cache] MISS - No existe caché para: ${key}`);
    return null;
  }

  if (entry.type !== "lista") {
    console.log(`[Cache] MISS - Tipo incorrecto para: ${key}`);
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
  return entry.data as ItemLista[];
}

/**
 * Obtiene una página de Notion del caché si existe y es válida
 */
export function getPageFromCache(pageId: string): NotionPageResponse | null {
  const key = `page_${pageId}`;
  const entry = cache.get(key);

  if (!entry) {
    console.log(`[Cache] MISS - No existe caché para página: ${pageId}`);
    return null;
  }

  if (entry.type !== "page") {
    console.log(`[Cache] MISS - Tipo incorrecto para página: ${pageId}`);
    return null;
  }

  if (!isCacheValid(entry)) {
    const ageMinutes = Math.round((Date.now() - entry.timestamp) / 1000 / 60);
    console.log(
      `[Cache] EXPIRED - Caché de página ${pageId} tiene ${ageMinutes} minutos (máx: 60)`,
    );
    return null;
  }

  const ageMinutes = Math.round((Date.now() - entry.timestamp) / 1000 / 60);
  console.log(
    `[Cache] HIT - Sirviendo página ${pageId} desde caché (edad: ${ageMinutes} min)`,
  );
  return entry.data as NotionPageResponse;
}

/**
 * Guarda datos en el caché (para listas)
 */
export function saveToCache(key: string, data: ItemLista[]): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    type: "lista",
  });
  console.log(
    `[Cache] SAVE - Guardado ${key} con ${data.length} items en caché`,
  );
}

/**
 * Guarda una página de Notion en el caché
 */
export function savePageToCache(
  pageId: string,
  data: NotionPageResponse,
): void {
  const key = `page_${pageId}`;
  cache.set(key, {
    data,
    timestamp: Date.now(),
    type: "page",
  });
  console.log(
    `[Cache] SAVE - Guardada página ${pageId} con ${data.blocks.length} bloques en caché`,
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
 * Invalida una página específica del caché
 */
export function invalidatePageCache(pageId: string): void {
  const key = `page_${pageId}`;
  cache.delete(key);
  console.log(`[Cache] INVALIDATE - Eliminada página ${pageId} del caché`);
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
  details: {
    key: string;
    ageMinutes: number;
    itemCount: number;
    type: string;
  }[];
} {
  const details = Array.from(cache.entries()).map(([key, entry]) => {
    let itemCount = 0;
    if (entry.type === "lista") {
      itemCount = (entry.data as ItemLista[]).length;
    } else if (entry.type === "page") {
      itemCount = (entry.data as NotionPageResponse).blocks.length;
    }

    return {
      key,
      ageMinutes: Math.round((Date.now() - entry.timestamp) / 1000 / 60),
      itemCount,
      type: entry.type,
    };
  });

  return {
    entries: cache.size,
    keys: Array.from(cache.keys()),
    details,
  };
}
