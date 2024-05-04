import { NextFunction, Request, Response } from "express";
import { LogsCollection } from "../database";

export const logger = (req: Request, _res: Response, next: NextFunction) => {
  if (req.path !== "/") {
    LogsCollection.insertMany({
      message: req.path,
    });
  }
  next();
};
