import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

///interfaces
import { ItemLista } from "../interfaces/notion.interface";

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

// GenItemLista : genera los items de las listas de la app
//
//
export async function getListaMenu(eItem: string): Promise<ItemLista[]> {
  try {
    const dbFinal = process.env[eItem];

    if (!dbFinal) {
      throw new Error(`Environment variable ${eItem} is not defined`);
    }

    const notionClient = getNotionClient();

    // Usando request directamente para evitar problemas de tipos con la versión antigua de la API
    const response = await notionClient.request<{
      results: PageObjectResponse[];
    }>({
      path: `databases/${dbFinal}/query`,
      method: "post",
    });

    return response.results.map((page: PageObjectResponse) => {
      const properties = page.properties;

      const nombreProp = properties["Nombre"] as {
        type: "title";
        title: Array<{ plain_text: string }>;
      };
      const destinoProp = properties["Destino"] as {
        type: "url";
        url: string | null;
      };
      const iconoProp = properties["Icono"] as {
        type?: "rich_text";
        rich_text?: Array<{ plain_text: string }>;
      };

      return {
        name: nombreProp.title[0]?.plain_text || "",
        destino: destinoProp.url || undefined,
        pageId: destinoProp.url ? undefined : page.id,
        icono: iconoProp?.rich_text?.map((t) => t.plain_text).join("") || "",
      };
    });
  } catch (error) {
    console.error("Error fetching Escuela items:", error);
    return [];
  }
}
