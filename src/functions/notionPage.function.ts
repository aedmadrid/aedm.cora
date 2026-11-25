import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type {
  NotionPageResponse,
  NotionBlock,
  RichTextItem,
  TableRowData,
} from "../interfaces/notionPage.interface";
import { getPageFromCache, savePageToCache } from "../services/cache.service";
import { getNotionClient } from "../services/notion.client";

// Profundidad máxima de anidamiento (column > callout > toggle > lista...)
const MAX_DEPTH = 6;

// Reintentos ante rate limit (429) o errores 5xx de Notion. El recorrido de
// bloques anidados multiplica las peticiones, así que conviene no dar la página
// por perdida en el primer 429.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetriable(error: any): boolean {
  const status = error?.status ?? error?.statusCode;
  return (
    status === 429 ||
    (typeof status === "number" && status >= 500 && status < 600) ||
    error?.code === "rate_limited"
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetriable(error) || attempt === attempts - 1) throw error;
      const retryAfter = Number((error as any)?.headers?.retryAfter ?? 0);
      await sleep(Math.min(500 * 2 ** attempt + retryAfter * 1000, 8_000));
    }
  }

  throw lastError;
}

/**
 * Procesa el rich_text de Notion a nuestro formato simplificado
 */
function processRichText(richText: any[]): RichTextItem[] {
  if (!richText || !Array.isArray(richText)) {
    return [];
  }

  return richText.map((item) => ({
    plain_text: item.plain_text || "",
    href: item.href || null,
    annotations: {
      bold: item.annotations?.bold || false,
      italic: item.annotations?.italic || false,
      underline: item.annotations?.underline || false,
      strikethrough: item.annotations?.strikethrough || false,
      color: item.annotations?.color || "default",
    },
  }));
}

/**
 * Ruta estable de esta API para servir un fichero alojado en Notion.
 * Las URLs de Notion caducan (~1 h), así que los clientes deben usar ésta.
 */
function mediaProxyPath(blockId: string): string {
  return `/media/${blockId}`;
}

/**
 * URL de un payload de fichero de Notion (image/video/file/audio/pdf).
 */
function payloadUrl(payload: any): string {
  if (!payload) return "";
  if (payload.type === "external") return payload.external?.url || "";
  if (payload.type === "file") return payload.file?.url || "";
  if (payload.type === "file_upload") return payload.file_upload?.url || "";
  return payload.external?.url || payload.file?.url || "";
}

/**
 * Devuelve todos los hijos de un bloque, paginando (Notion devuelve 100 por
 * página). Sin esto las páginas largas se cortaban y los bloques anidados
 * (columnas, tablas, toggles...) no aparecían nunca.
 */
async function listChildren(blockId: string): Promise<any[]> {
  const notionClient = getNotionClient();
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await withRetry(() =>
      notionClient.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: cursor,
      }),
    );
    results.push(...response.results);
    cursor =
      "has_more" in response && response.has_more
        ? (response.next_cursor as string) || undefined
        : undefined;
  } while (cursor);

  return results;
}

async function childrenOf(block: any, depth: number): Promise<NotionBlock[]> {
  if (!block.has_children || depth >= MAX_DEPTH) return [];

  try {
    return await processBlocks(await listChildren(block.id), depth + 1);
  } catch (error) {
    // Un bloque anidado que falla no debe tumbar la página entera.
    console.error(
      `[Notion] no se pudieron leer los hijos de ${block.id} (${block.type}):`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Procesa una lista de bloques de Notion.
 * Los bloques "transparentes" (synced_block, unsupported...) se aplanan.
 */
async function processBlocks(
  blocks: any[],
  depth = 0,
): Promise<NotionBlock[]> {
  const out: NotionBlock[] = [];

  for (const block of blocks) {
    const processed = await processBlock(block, depth);
    if (!processed) continue;
    if (Array.isArray(processed)) {
      out.push(...processed);
    } else {
      out.push(processed);
    }
  }

  return out;
}

/**
 * Procesa un bloque de Notion y lo convierte a nuestro formato JSON.
 * Puede devolver varios bloques (bloques aplanados) o null (no soportado).
 */
async function processBlock(
  block: any,
  depth: number,
): Promise<NotionBlock | NotionBlock[] | null> {
  const id: string = block.id;

  switch (block.type) {
    case "paragraph": {
      const children = await childrenOf(block, depth);
      return {
        id,
        type: "paragraph",
        rich_text: processRichText(block.paragraph?.rich_text),
        ...(children.length ? { children } : {}),
      };
    }

    case "heading_1":
      return {
        id,
        type: "heading_1",
        rich_text: processRichText(block.heading_1?.rich_text),
      };

    case "heading_2":
      return {
        id,
        type: "heading_2",
        rich_text: processRichText(block.heading_2?.rich_text),
      };

    case "heading_3":
      return {
        id,
        type: "heading_3",
        rich_text: processRichText(block.heading_3?.rich_text),
      };

    case "bulleted_list_item": {
      const children = await childrenOf(block, depth);
      return {
        id,
        type: "bulleted_list_item",
        rich_text: processRichText(block.bulleted_list_item?.rich_text),
        ...(children.length ? { children } : {}),
      };
    }

    case "numbered_list_item": {
      const children = await childrenOf(block, depth);
      return {
        id,
        type: "numbered_list_item",
        rich_text: processRichText(block.numbered_list_item?.rich_text),
        ...(children.length ? { children } : {}),
      };
    }

    case "to_do": {
      const children = await childrenOf(block, depth);
      return {
        id,
        type: "to_do",
        rich_text: processRichText(block.to_do?.rich_text),
        checked: block.to_do?.checked || false,
        ...(children.length ? { children } : {}),
      };
    }

    case "quote": {
      const children = await childrenOf(block, depth);
      return {
        id,
        type: "quote",
        rich_text: processRichText(block.quote?.rich_text),
        ...(children.length ? { children } : {}),
      };
    }

    case "bookmark":
      return {
        id,
        type: "bookmark",
        url: block.bookmark?.url || "",
      };

    case "link_preview":
      return {
        id,
        type: "bookmark",
        url: block.link_preview?.url || "",
      };

    case "code":
      return {
        id,
        type: "code",
        rich_text: processRichText(block.code?.rich_text),
        language: block.code?.language || "plain text",
      };

    case "divider":
      return { id, type: "divider" };

    case "embed":
      return { id, type: "embed", url: block.embed?.url || "" };

    case "child_page":
      return {
        id,
        type: "child_page",
        title: block.child_page?.title || "",
      };

    case "link_to_page": {
      // Enlace a otra página: se expone como child_page usando el id destino.
      const target = block.link_to_page || {};
      const pageId =
        target.page_id || target.database_id || target.comment_id || id;
      return { id: pageId, type: "child_page", title: "" };
    }

    case "image":
    case "video":
    case "file": {
      const payload = block[block.type];
      return {
        id,
        type: block.type,
        url: payloadUrl(payload),
        proxy_url: mediaProxyPath(id),
        caption: processRichText(payload?.caption),
      };
    }

    case "table": {
      const rowBlocks = block.has_children
        ? await listChildren(block.id)
        : [];
      const rows: TableRowData[] = rowBlocks
        .filter((row: any) => row.type === "table_row")
        .map((row: any) => ({
          id: row.id,
          cells: (row.table_row?.cells || []).map((cell: any[]) =>
            processRichText(cell),
          ),
        }));

      return {
        id,
        type: "table",
        table_width:
          block.table?.table_width ||
          rows.reduce((max, row) => Math.max(max, row.cells.length), 0),
        has_column_header: !!block.table?.has_column_header,
        has_row_header: !!block.table?.has_row_header,
        rows,
      };
    }

    case "table_row":
      // Sólo aparecen dentro de una tabla, que ya los procesa.
      return null;

    case "column_list": {
      const columnBlocks = block.has_children
        ? await listChildren(block.id)
        : [];
      const columns: any[] = [];

      for (const columnBlock of columnBlocks as any[]) {
        if (columnBlock.type !== "column") continue;
        const blocks = await childrenOf(columnBlock, depth);
        columns.push({
          id: columnBlock.id,
          type: "column",
          width_ratio: columnBlock.column?.width_ratio ?? 1,
          blocks,
        });
      }

      if (!columns.length) return null;
      return { id, type: "column_list", columns };
    }

    case "column": {
      // Suelto (fuera de column_list): se aplana su contenido.
      return childrenOf(block, depth);
    }

    case "toggle": {
      const children = await childrenOf(block, depth);
      return {
        id,
        type: "toggle",
        rich_text: processRichText(block.toggle?.rich_text),
        color: block.toggle?.color || "default",
        children,
      };
    }

    case "callout": {
      const children = await childrenOf(block, depth);
      const icon = block.callout?.icon;
      return {
        id,
        type: "callout",
        rich_text: processRichText(block.callout?.rich_text),
        icon: icon?.emoji || payloadUrl(icon) || "",
        color: block.callout?.color || "default",
        children,
      };
    }

    case "synced_block":
      // Bloque sincronizado: se muestra el contenido real.
      return childrenOf(block, depth);

    default:
      return null;
  }
}

/**
 * Obtiene el título de una página de Notion
 */
async function getPageTitle(pageId: string): Promise<string> {
  const notionClient = getNotionClient();

  try {
    const page = (await notionClient.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    // Buscar la propiedad de título
    if (page.properties) {
      for (const key in page.properties) {
        const prop = page.properties[key];
        if (prop.type === "title") {
          const titleProp = prop as {
            type: "title";
            title: Array<{ plain_text: string }>;
          };
          return titleProp.title.map((t) => t.plain_text).join("");
        }
      }
    }

    return "";
  } catch (error) {
    console.error("Error fetching page title:", error);
    return "";
  }
}

/**
 * Obtiene el contenido de una página de Notion directamente de la API
 */
async function fetchNotionPage(pageId: string): Promise<NotionPageResponse> {
  const blocksResponse = await listChildren(pageId);
  const blocks = await processBlocks(blocksResponse);
  const pageTitle = await getPageTitle(pageId);

  return {
    current_page_title: pageTitle,
    blocks,
  };
}

/**
 * Obtiene el contenido de una página de Notion en formato JSON
 * Usa caché para no saturar la API de Notion (TTL: 60 minutos)
 */
export async function getNotionPageJson(
  pageId: string,
): Promise<NotionPageResponse> {
  const cacheKey = `page_${pageId}`;

  try {
    // Primero intentar obtener del caché
    const cachedData = getPageFromCache(cacheKey);

    if (cachedData !== null) {
      return cachedData;
    }

    // No hay caché válido, obtener de Notion
    const freshData = await fetchNotionPage(pageId);

    // Guardar en caché para próximas peticiones
    savePageToCache(cacheKey, freshData);

    return freshData;
  } catch (error) {
    console.error("Error fetching Notion page:", error);
    throw error;
  }
}
