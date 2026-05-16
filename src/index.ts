import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import apiRoutes, {
  setupCacheRoutes,
  setupCacheStatsRoutes,
  setupNotionPageRoutes,
} from "./apiRoutes";

const app = express();
const adminApp = express();

const allowedOrigins = [
  "https://beta.aedm.org.es",
  "https://aedm.org.es",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

adminApp.use(cors());

const port = process.env.PORT || 8000;
const adminPort = process.env.ADMIN_PORT || 8080;

app.get("/", (req: Request, res: Response) => {
  res.send("aedm.Cora <3");
});

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

app.get("/ver", (req: Request, res: Response) => {
  res.send(
    JSON.stringify({
      commit: require("child_process")
        .execSync("git rev-parse HEAD")
        .toString()
        .trim(),
      date: require("child_process")
        .execSync("git log -1 --format=%ci")
        .toString()
        .trim(),
    }),
  );
});

console.log(
  "                                                                                       ",
);
console.log(
  "                                                                                       ",
);
console.log(
  "                                           ____                                        ",
);
console.log(
  "                            ,---,        ,'  , `.                                      ",
);
console.log(
  "                          ,---.'|     ,-+-,.' _ |          ,---.    __  ,-.            ",
);
console.log(
  "                          |   | :  ,-+-. ;   , ||         '   ,'\\ ,' ,'/ /|            ",
);
console.log(
  "   ,--.--.     ,---.      |   | | ,--.'|'   |  || ,---.  /   /   |'  | |' | ,--.--.    ",
);
console.log(
  "  /       \\   /     \\   ,--.__| ||   |  ,', |  |,/     \\.   ; ,. :|  |   ,'/       \\   ",
);
console.log(
  " .--.  .-. | /    /  | /   ,'   ||   | | ,--.'|'   |  || ,---.  /   /   |'  | |' | ,--.--.    ",
);
console.log(
  "  \\__\\/ : . ..    ' / |.   '  /  ||   : |  | ,  .    ' / '   | .; :|  | '   \\__\\/ : . .  ",
);
console.log(
  "  ,\" .--.; |'   ;   /|'   ; |:  ||   : |  |/   '   ; :__|   :    |;  : |   ,\" .--.; |  ",
);
console.log(
  " /  /  ,.  |'   |  / ||   | '/  '|   | |`-'___ '   | '.'|\\   \\  / |  , ;  /  /  ,.  |  ",
);
console.log(
  ";  :   .'   \\   :    ||   :    :||   ;/   /  .\\|   :    : `----'   ---'  ;  :   .'   \\ ",
);
console.log(
  "|  ,     .-./\\   \\  /  \\   \\  /  '---'    \\  ; |\\   \\  /                 |  ,     .-./ ",
);
console.log(
  " `--`---'     `----'    `----'             `--\"  `----'                   `--`---'     ",
);

// Rutas de datos (con caché automático de 60 min)
apiRoutes(app, "WEB_DB");
apiRoutes(app, "ACTIVIDADES_DB");
apiRoutes(app, "AEDM_DB");
apiRoutes(app, "ESCUELA_DB");
apiRoutes(app, "INICIO_DB");
apiRoutes(app, "PROYECTOS_DB");

// Rutas de páginas de Notion
setupNotionPageRoutes(app);

// Rutas de caché por DB (puerto admin)
const dbs = [
  "WEB_DB",
  "ACTIVIDADES_DB",
  "AEDM_DB",
  "ESCUELA_DB",
  "INICIO_DB",
  "PROYECTOS_DB",
];
dbs.forEach((DB) => setupCacheRoutes(adminApp, DB));

// Rutas globales de caché (puerto admin)
setupCacheStatsRoutes(adminApp);

app.listen(port, () => {
  console.log(`El (cora)zon late en http://localhost:${port}`);
  console.log(`\nEndpoints disponibles:`);
  console.log(
    `  - GET /{DB}.json         → Obtiene datos (desde caché si < 60 min)`,
  );
  console.log(`  - GET /id/{id}.json      → Obtiene página de Notion en JSON`);
});

adminApp.listen(adminPort, () => {
  console.log(
    `\n🔧 Admin endpoints (solo red local) en http://localhost:${adminPort}`,
  );
  console.log(`  - GET /{DB}.json/refresh → Fuerza recarga desde Notion`);
  console.log(`  - GET /cache/stats       → Ver estadísticas del caché`);
  console.log(`  - GET /cache/clear       → Limpiar todo el caché`);
});

export default app;
