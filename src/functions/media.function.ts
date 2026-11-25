import type { Request, Response } from "express";
import { getNotionClient } from "../services/notion.client";

// Las URLs firmadas de Notion caducan a la hora: se cachean algo menos.
const URL_TTL_MS = 45 * 60 * 1000;

// Tope para servir el fichero en streaming desde esta API. Por encima se
// redirige a la URL de Notion (que sí caduca, pero evita reventar memoria).
const MAX_BUFFERED_BYTES = 30 * 1024 * 1024;

interface ResolvedMedia {
  url: string;
  external: boolean;
  type: string;
  lastEdited: string;
  expiresAt: number;
}

const mediaCache = new Map<string, ResolvedMedia>();

/**
 * Obtiene la URL actual (fresca) del fichero de un bloque de Notion.
 */
export async function resolveMedia(blockId: string): Promise<ResolvedMedia | null> {
  const cached = mediaCache.get(blockId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const block: any = await getNotionClient().blocks.retrieve({
    block_id: blockId,
  });

  const type: string = block.type;
  const payload = block[type];
  if (!payload || !["image", "video", "file", "audio", "pdf"].includes(type)) {
    return null;
  }

  const external = payload.type === "external";
  const url: string = external
    ? payload.external?.url || ""
    : payload.file?.url || "";

  if (!url) return null;

  const resolved: ResolvedMedia = {
    url,
    external,
    type,
    lastEdited: block.last_edited_time || "",
    expiresAt: Date.now() + URL_TTL_MS,
  };

  mediaCache.set(blockId, resolved);
  return resolved;
}

/**
 * GET /media/:id  (alias /img/:id)
 *
 * Sirve el fichero de un bloque de Notion con una URL estable para siempre.
 * Es lo que usan las webs/apps: las URLs directas de Notion caducan a la hora
 * y dejaban las imágenes rotas en sitios estáticos.
 */
export async function mediaHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const blockId = req.params.id;

  try {
    const media = await resolveMedia(blockId);

    if (!media) {
      res.status(404).json({ error: "Media no encontrada" });
      return;
    }

    const etag = `"${blockId}-${media.lastEdited}"`;
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");

    // Los ficheros externos (no subidos a Notion) no caducan: redirigimos.
    if (media.external) {
      res.redirect(302, media.url);
      return;
    }

    const upstream = await fetch(media.url);
    if (!upstream.ok) {
      console.error(
        `[media] Notion respondió ${upstream.status} para ${blockId}`,
      );
      res.status(502).json({ error: "No se pudo obtener el fichero" });
      return;
    }

    const length = Number(upstream.headers.get("content-length") || 0);
    if (length > MAX_BUFFERED_BYTES) {
      res.redirect(302, media.url);
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/octet-stream",
    );
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Content-Disposition", "inline");
    res.send(buffer);
  } catch (error) {
    const err = error as { status?: number; code?: string };
    if (err?.status === 404 || err?.code === "object_not_found") {
      res.status(404).json({ error: "Media no encontrada" });
      return;
    }
    console.error(`[media] Error sirviendo ${blockId}:`, error);
    if (!res.headersSent) {
      res.status(502).json({ error: "No se pudo obtener el fichero" });
    }
  }
}
