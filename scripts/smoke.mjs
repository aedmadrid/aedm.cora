// Smoke test del API: arranca dist/index.js y comprueba, contra el Notion real,
// las dos cosas que se rompían: tablas en /id/{id}.json y ficheros en /media.
// Sin NOTION_KEY se salta (exit 0) para no romper CI sin credenciales.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.env.SMOKE_PORT || 8123);
const BASE = `http://127.0.0.1:${PORT}`;
const DB_PATHS = ["WEB_DB", "ACTIVIDADES_DB", "AEDM_DB", "ESCUELA_DB", "INICIO_DB", "PROYECTOS_DB"];
// Las páginas se piden de 3 en 3 (el API respeta el rate limit de Notion) hasta
// encontrar una con tabla y otra con imagen.
const CONCURRENCY = 3;

function hasNotionKey() {
  if (process.env.NOTION_KEY) return true;
  try {
    return /^NOTION_KEY=\S+/m.test(readFileSync(new URL("../.env", import.meta.url), "utf8"));
  } catch {
    return false;
  }
}

function fail(message) {
  throw new Error(message);
}

async function check(label, fn) {
  try {
    return await fn();
  } catch (error) {
    fail(`${label}: ${error instanceof Error ? error.message : error}`);
  }
}

const get = (path, timeoutMs = 120_000) =>
  fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(timeoutMs) });

async function json(path) {
  const res = await get(path);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

/** Ids de página de todas las bases de datos ("pageId" en cualquier nivel). */
function collectPageIds(node, out = new Set()) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const value of node) collectPageIds(value, out);
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "pageId" && typeof value === "string") out.add(value);
    else collectPageIds(value, out);
  }
  return out;
}

async function main() {
  if (!hasNotionKey()) {
    console.log("· NOTION_KEY no definida: smoke test saltado");
    return;
  }

  const server = spawn(process.execPath, ["dist/index.js"], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  });

  try {
    await check("arranque", async () => {
      for (let i = 0; i < 40; i++) {
        try {
          if ((await get("/health", 2_000)).ok) return;
        } catch {}
        await sleep(250);
      }
      throw new Error("el servidor no respondió en /health");
    });
    console.log("✓ arranque: /health OK");

    const ids = new Set();
    for (const db of DB_PATHS) {
      for (const id of collectPageIds(await json(`/${db}.json`))) ids.add(id);
    }
    if (!ids.size) fail("ninguna página en las bases de datos");

    let table;
    let media;
    let okPages = 0;
    const failures = [];
    const queue = [...ids];

    while (queue.length && !(table && media)) {
      const batch = queue.splice(0, CONCURRENCY);
      const pages = await Promise.all(
        batch.map(async (id) => {
          try {
            const blocks = (await json(`/id/${id}.json`)).blocks ?? [];
            okPages++;
            return blocks;
          } catch (error) {
            // Un 429 puntual de Notion no debe tumbar el test: se anota y sigue.
            failures.push(`${id}: ${error instanceof Error ? error.message : error}`);
            return [];
          }
        }),
      );

      for (const blocks of pages) {
        table ??= blocks.find((b) => b.type === "table" && b.rows?.length);
        media ??= blocks.find((b) => b.proxy_url && b.type === "image");
      }
    }

    if (okPages === 0) fail(`ninguna página respondió:\n  ${failures.join("\n  ")}`);
    if (failures.length) console.warn(`· ${failures.length} página(s) fallaron: ${failures.join(", ")}`);

    await check("tablas", async () => {
      if (!table) throw new Error(`ninguna tabla en ${ids.size} páginas`);
      if (!table.rows[0]?.cells?.length) throw new Error("tabla sin celdas");
      const width = table.rows[0].cells.length;
      if (table.table_width !== width) throw new Error(`table_width ${table.table_width} ≠ ${width} columnas`);
      if (typeof table.rows[0].cells[0][0]?.plain_text !== "string")
        throw new Error("celda sin rich_text procesado");
    });
    console.log(
      `✓ tablas: ${table.rows.length} filas × ${table.table_width} columnas, ` +
        `cabecera ${table.has_column_header ? "sí" : "no"}`,
    );

    await check("media", async () => {
      if (!media) throw new Error(`ninguna imagen con proxy_url en ${ids.size} páginas`);
      const res = await get(media.proxy_url);
      if (!res.ok) throw new Error(`${media.proxy_url} → HTTP ${res.status}`);
      const type = res.headers.get("content-type") || "";
      if (!/^(image|video|application)\//.test(type)) throw new Error(`content-type inesperado: ${type}`);
      const bytes = (await res.arrayBuffer()).byteLength;
      if (bytes < 1024) throw new Error(`respuesta demasiado pequeña: ${bytes} bytes`);
      const missing = await get("/media/00000000-0000-0000-0000-000000000000");
      if (missing.status !== 404) throw new Error(`media inexistente → HTTP ${missing.status}, esperado 404`);
    });
    console.log(`✓ media: ${media.proxy_url} sirve el fichero (200) y 404 si no existe`);

    console.log("\nSmoke test OK");
  } finally {
    // Cierra el servidor de verdad: si no muere con SIGTERM, SIGKILL.
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      sleep(2_000).then(() => server.kill("SIGKILL")),
    ]);
  }
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
