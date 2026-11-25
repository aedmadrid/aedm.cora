import { Client } from "@notionhq/client";

let notion: Client | null = null;

/**
 * Cliente de Notion compartido por las funciones del API.
 */
export function getNotionClient(): Client {
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
