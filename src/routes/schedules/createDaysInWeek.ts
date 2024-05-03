import { NextFunction, Request, Response } from "express";
import { DaysInWeekScheduleCreator } from "./creators/DaysInWeekScheduleCreator";
import { sendParsingError } from "../../helper/parsing";
import { ZodError } from "zod";

export const createDaysInWeek = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const daysInWeekScheduleCreator = new DaysInWeekScheduleCreator(req.body);
    await daysInWeekScheduleCreator.create(res);
  } catch (error) {
    if (error instanceof ZodError) return sendParsingError(error, res);
    next(error);
  }
};
