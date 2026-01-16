import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type {
  NotionPageResponse,
  NotionBlock,
  RichTextItem,
} from "../interfaces/notionPage.interface";
import { getPageFromCache, savePageToCache } from "../services/cache.service";

let notion: Client;

function getNotionClient(): Client {
  if (!notion) {
    if (!process.env.NOTION_KEY) {
      throw new Error("NOTION_KEY is not defined in environment variables");
    }
    notion = new Client({
      auth: process.env.NOTION_KEY,
      notionVersion: "2022-06-28",
    });
  }
  return notion;
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
 * Procesa un bloque de Notion y lo convierte a nuestro formato JSON
 */
function processBlock(block: any): NotionBlock | null {
  const id = block.id;

  if ("paragraph" in block) {
    return {
      id,
      type: "paragraph",
      rich_text: processRichText(block.paragraph.rich_text),
    };
  }

  if ("heading_1" in block) {
    return {
      id,
      type: "heading_1",
      rich_text: processRichText(block.heading_1.rich_text),
    };
  }

  if ("heading_2" in block) {
    return {
      id,
      type: "heading_2",
      rich_text: processRichText(block.heading_2.rich_text),
    };
  }

  if ("heading_3" in block) {
    return {
      id,
      type: "heading_3",
      rich_text: processRichText(block.heading_3.rich_text),
    };
  }

  if ("bulleted_list_item" in block) {
    return {
      id,
      type: "bulleted_list_item",
      rich_text: processRichText(block.bulleted_list_item.rich_text),
    };
  }

  if ("to_do" in block) {
    return {
      id,
      type: "to_do",
      rich_text: processRichText(block.to_do.rich_text),
      checked: block.to_do.checked || false,
    };
  }

  if ("quote" in block) {
    return {
      id,
      type: "quote",
      rich_text: processRichText(block.quote.rich_text),
    };
  }

  if ("bookmark" in block) {
    return {
      id,
      type: "bookmark",
      url: block.bookmark.url || "",
    };
  }

  if ("code" in block) {
    return {
      id,
      type: "code",
      rich_text: processRichText(block.code.rich_text),
      language: block.code.language || "plain text",
    };
  }

  if ("divider" in block) {
    return {
      id,
      type: "divider",
    };
  }

  if ("embed" in block) {
    return {
      id,
      type: "embed",
      url: block.embed.url || "",
    };
  }

  if ("child_page" in block) {
    return {
      id,
      type: "child_page",
      title: block.child_page.title || "",
    };
  }

  if ("image" in block) {
    let url = "";
    if (block.image.type === "external") {
      url = block.image.external?.url || "";
    } else if (block.image.type === "file") {
      url = block.image.file?.url || "";
    }

    return {
      id,
      type: "image",
      url,
      caption: processRichText(block.image.caption),
    };
  }

  // Bloque no soportado, retornar null
  return null;
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
  const notionClient = getNotionClient();

  // Obtener los bloques de la página
  const blocksResponse = await notionClient.blocks.children.list({
    block_id: pageId,
  });

  // Procesar los bloques
  const blocks: NotionBlock[] = [];
  for (const block of blocksResponse.results) {
    const processedBlock = processBlock(block);
    if (processedBlock) {
      blocks.push(processedBlock);
    }
  }

  // Obtener el título de la página
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
