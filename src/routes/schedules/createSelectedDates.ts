import { NextFunction, Request, Response } from "express";
import { SelectedDateSchedulerCreator } from "./creators/SelectedDatesScheduleCreator";
import { ZodError } from "zod";
import { sendParsingError } from "../../helper/parsing";

export const createSelectedDates = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const selectedDateSchedulerCreator = new SelectedDateSchedulerCreator(
      req.body,
    );
    await selectedDateSchedulerCreator.create(res);
  } catch (error) {
    if (error instanceof ZodError) return sendParsingError(error, res);
    next(error);
  }
};
