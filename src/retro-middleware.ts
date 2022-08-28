import { Request, Response, NextFunction } from "express";
import { isOldBrowser } from "./old-browser";

export function retroMiddleware(req: Request, _: Response, next: NextFunction) {
  req.isOldBrowser = isOldBrowser(req);
  next();
}
