import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { ADMIN_USERNAME, JWT_SECRET_KEY } from "./config";

export interface AuthReq extends Request {
  user?: string;
}

export const authorization = (
  req: AuthReq,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.sendStatus(403);
  }

  try {
    const data = jwt.verify(token, JWT_SECRET_KEY) as jwt.JwtPayload;

    const user: string = data.user;

    if (user != ADMIN_USERNAME) {
      return res.sendStatus(403);
    }

    req.user = user;
    return next();
  } catch {
    return res.sendStatus(403);
  }
};
