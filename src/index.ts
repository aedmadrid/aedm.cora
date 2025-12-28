import "dotenv/config";
import express, { Request, Response } from "express";

import { getListaMenu } from "./functions/notion.function";

const app = express();
const port = 8000;

app.get("/", (req: Request, res: Response) => {
  res.send("aedm.Cora <3");
});

app.listen(port, () => {
  console.log(`El (cora)zon late en http://localhost:${port}`);
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
  " .--.  .-. | /    /  | /   ,'   ||   | /  | |--'/    / ''   | |: :'  :  / .--.  .-. |  ",
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



//// listas de la app 
// en un futuro, mover a listRoutes.ts
app.get("/aedmLista.json", (req: Request, res: Response) => {
  
  (async () => {
  const items = await getListaMenu("AEDM_DB");
  res.json(items);
})();
});


app.get("/EscuelaLista.json", (req: Request, res: Response) => {
  
  (async () => {
  const items = await getListaMenu("ESCUELA_DB");
  res.json(items);
})();
});

app.get("/WebLista.json", (req: Request, res: Response) => {
  
  (async () => {
  const items = await getListaMenu("WEB_DB");
  res.json(items);
})();
});

app.get("/ActividadesLista.json", (req: Request, res: Response) => {
  
  (async () => {
  const items = await getListaMenu("ACTIVIDADES_DB");
  res.json(items);
})();
}); 

app.get("/InicioLista.json", (req: Request, res: Response) => { 
  (async () => {
  const items = await getListaMenu("INICIO_DB");
  res.json(items);
} )();
}); 

export default app;

