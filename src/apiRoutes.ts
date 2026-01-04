import { Express, Request, Response } from "express";
import { getListaMenu } from "./functions/notion.function";
import {
  getCacheStats,
  invalidateCache,
  clearCache,
} from "./services/cache.service";

export default function apiRoutes(app: Express, DB: string) {
  // Endpoint principal para obtener datos (usa caché automáticamente)
  app.get(`/${DB}.json`, (req: Request, res: Response) => {
    (async () => {
      const items = await getListaMenu(DB);
      res.json(items);
    })();
  });

  // Endpoint para forzar recarga desde Notion (invalida caché primero)
  app.get(`/${DB}.json/refresh`, (req: Request, res: Response) => {
    (async () => {
      console.log(`[API] Forzando recarga de ${DB}`);
      invalidateCache(DB);
      const items = await getListaMenu(DB);
      res.json({
        message: `Cache de ${DB} actualizado`,
        itemCount: items.length,
        data: items,
      });
    })();
  });
}

// Endpoints globales de caché (llamar una sola vez desde index.ts)
export function setupCacheRoutes(app: Express) {
  // Ver estadísticas del caché
  app.get("/cache/stats", (req: Request, res: Response) => {
    const stats = getCacheStats();
    res.json(stats);
  });

  // Limpiar todo el caché
  app.get("/cache/clear", (req: Request, res: Response) => {
    clearCache();
    res.json({ message: "Caché completamente limpiado" });
  });
}
