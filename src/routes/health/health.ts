import { Request, Response } from "express";

export const health = (_: Request, res: Response) => {
  res.send("API Active");
};
