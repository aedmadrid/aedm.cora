import "dotenv/config";
import express, { Request, Response } from "express";
import apiRoutes from "./apiRoutes";


const app = express();
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

apiRoutes(app, "WEB_DB");
apiRoutes(app, "ACTIVIDADES_DB");
apiRoutes(app, "AEDM_DB");
apiRoutes(app, "ESCUELA_DB");
apiRoutes(app, "INICIO_DB"); 


app.listen(port, () => {
  console.log(`El (cora)zon late en http://localhost:${port}`);
});

export default app;

