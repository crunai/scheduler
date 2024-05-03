import { NextFunction, Request, Response } from "express";
import { LogsCollection } from "../database";

export const logger = (req: Request, _res: Response, next: NextFunction) => {
  LogsCollection.insertMany({
    message: req.path,
  });
  next();
};
