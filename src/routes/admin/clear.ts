import { Request, Response } from "express";
import { LogsCollection, SchedulesCollection } from "../../database";
import { getAuthToken } from "../../helper/encryption";

export const clear = async (req: Request, res: Response) => {
  const result = getAuthToken(req.headers.authorization, res);
  if (result.error) {
    return result.error;
  }

  const perm = result.token;

  if (process.env.CLEAR_PERM && process.env.CLEAR_PERM === perm) {
    await SchedulesCollection.deleteMany({});
    await LogsCollection.deleteMany({});
    res.json({});
  } else {
    res.status(403).send("Not authorised");
  }
};
