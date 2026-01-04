import { Express, Request, Response } from "express";
import { getListaMenu } from "./functions/notion.function";

export default function apiRoutes(app: Express, DB: string) {
  app.get(`/${DB}.json`, (req: Request, res: Response) => {
    (async () => {
      const items = await getListaMenu(DB);
      res.json(items);
    })();
  });
}