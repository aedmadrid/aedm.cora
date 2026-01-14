import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import apiRoutes, { setupCacheRoutes } from "./apiRoutes";

const app = express();

// Configuración CORS
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
const port = 8000;

app.get("/", (req: Request, res: Response) => {
  res.send("aedm.Cora <3");
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

// Rutas de administración del caché
setupCacheRoutes(app);

app.listen(port, () => {
  console.log(`El (cora)zon late en http://localhost:${port}`);
  console.log(`\nEndpoints disponibles:`);
  console.log(
    `  - GET /{DB}.json         → Obtiene datos (desde caché si < 60 min)`,
  );
  console.log(`  - GET /{DB}.json/refresh → Fuerza recarga desde Notion`);
  console.log(`  - GET /cache/stats       → Ver estadísticas del caché`);
  console.log(`  - GET /cache/clear       → Limpiar todo el caché`);
});

export default app;
