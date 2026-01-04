import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

///interfaces
import { ItemLista } from "../interfaces/notion.interface";
import { getFromCache, saveToCache } from "../services/cache.service";

let notion: Client;

function getNotionClient(): Client {
  if (!notion) {
    if (!process.env.NOTION_KEY) {
      throw new Error("NOTION_KEY is not defined in environment variables");
    }
    notion = new Client({
      auth: process.env.NOTION_KEY,
      notionVersion: "2022-06-28", // Usando versión anterior con databases.query, a futuro migrar
    });
  }
  return notion;
}

/**
 * Obtiene datos directamente de la API de Notion (sin caché)
 */
async function fetchFromNotion(eItem: string): Promise<ItemLista[]> {
  const dbFinal = process.env[eItem];
  console.log(`[Notion API] Fetching ${eItem}, DB ID: ${dbFinal}`);

  if (!dbFinal) {
    throw new Error(`Environment variable ${eItem} is not defined`);
  }

  const notionClient = getNotionClient();

  const response = await notionClient.request<{
    results: PageObjectResponse[];
  }>({
    path: `databases/${dbFinal}/query`,
    method: "post",
  });

  console.log(
    `[Notion API] Got ${response.results.length} results for ${eItem}`,
  );

  return response.results.map((page: PageObjectResponse) => {
    const properties = page.properties;

    // Buscar la propiedad de título (puede ser "Nombre" o "Título")
    const nombreProp = (properties["Nombre"] || properties["Título"]) as
      | {
          type: "title";
          title: Array<{ plain_text: string }>;
        }
      | undefined;

    // Buscar la propiedad de destino (puede ser "Destino" o "Link")
    const destinoProp = (properties["Destino"] || properties["Link"]) as
      | {
          type: "url";
          url: string | null;
        }
      | undefined;

    const iconoProp = properties["Icono"] as
      | {
          type?: "rich_text";
          rich_text?: Array<{ plain_text: string }>;
        }
      | undefined;

    const imagenProp = properties["Imagen"] as
      | {
          type: "url";
          url: string | null;
        }
      | undefined;

    const descripcionProp = properties["Descripción"] as
      | {
          type: "rich_text";
          rich_text: Array<{ plain_text: string }>;
        }
      | undefined;

    const fechaProp = properties["Fecha"] as
      | {
          type: "date";
          date: { start: string } | null;
        }
      | undefined;

    const textobotonProp = properties["Botón"] as
      | {
          type: "rich_text";
          rich_text: Array<{ plain_text: string }>;
        }
      | undefined;

    return {
      name: nombreProp?.title?.[0]?.plain_text || "",
      destino: destinoProp?.url || undefined,
      pageId: destinoProp?.url ? undefined : page.id,
      icono: iconoProp?.rich_text?.map((t) => t.plain_text).join("") || "",
      imagen: imagenProp?.url || undefined,
      descripcion:
        descripcionProp?.rich_text?.map((t) => t.plain_text).join("") ||
        undefined,
      fecha: fechaProp?.date?.start
        ? new Date(fechaProp.date.start)
        : undefined,
      textoboton:
        textobotonProp?.rich_text?.map((t) => t.plain_text).join("") ||
        undefined,
    };
  });
}

// GenItemLista : genera los items de las listas de la app
// Usa caché para no saturar la API de Notion (TTL: 60 minutos)
//
export async function getListaMenu(eItem: string): Promise<ItemLista[]> {
  try {
    // Primero intentar obtener del caché
    const cachedData = getFromCache(eItem);

    if (cachedData !== null) {
      // Datos válidos en caché, devolverlos
      return cachedData;
    }

    // No hay caché válido, obtener de Notion
    const freshData = await fetchFromNotion(eItem);

    // Guardar en caché para próximas peticiones
    saveToCache(eItem, freshData);

    return freshData;
  } catch (error) {
    console.error(`Error fetching ${eItem} items:`, error);
    return [];
  }
}
