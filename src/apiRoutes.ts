import { Express, Request, Response } from "express";
import { getListaMenu } from "./functions/notion.function";
import { getNotionPageJson } from "./functions/notionPage.function";
import {
  getCacheStats,
  invalidateCache,
  invalidatePageCache,
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

// Endpoint para obtener una página de Notion en formato JSON
export function setupNotionPageRoutes(app: Express) {
  app.get("/id/:id.json", (req: Request, res: Response) => {
    (async () => {
      try {
        const pageId = req.params.id;
        console.log(`[API] Obteniendo página de Notion: ${pageId}`);
        const pageData = await getNotionPageJson(pageId);
        res.json(pageData);
      } catch (error) {
        console.error("[API] Error obteniendo página:", error);
        res.status(500).json({ error: "Error al obtener la página" });
      }
    })();
  });

  // Endpoint para forzar recarga de una página desde Notion
  app.get("/id/:id.json/refresh", (req: Request, res: Response) => {
    (async () => {
      try {
        const pageId = req.params.id;
        console.log(`[API] Forzando recarga de página: ${pageId}`);
        invalidatePageCache(pageId);
        const pageData = await getNotionPageJson(pageId);
        res.json({
          message: `Cache de página ${pageId} actualizado`,
          blockCount: pageData.blocks.length,
          data: pageData,
        });
      } catch (error) {
        console.error("[API] Error recargando página:", error);
        res.status(500).json({ error: "Error al recargar la página" });
      }
    })();
  });
}
