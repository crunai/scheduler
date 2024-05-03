import { Response } from "express";
import { ZodError, z } from "zod";
import { createUTCDateTimeFromMillis } from "./timing";

export const sanitiseString = (str: string, ctx: z.RefinementCtx) => {
  const validName = new RegExp("^[a-z0-9 ,'-]+$", "i");
  const processedName = str.trim();
  if (processedName.length === 0 || !validName.test(processedName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid String",
    });
    return z.NEVER;
  }
  return processedName;
};

export const validUnixmsTime = (time: number) => {
  return createUTCDateTimeFromMillis(time).isValid;
};

export const parseToSingleError = <T>(error: ZodError<T>) => {
  const firstError = error.errors[0];
  if (!firstError) {
    return "Error occurred when parsing error";
  }

  const errorPathJoined = firstError.path
    .filter((path) => typeof path === "string")
    .join(":");
  if (errorPathJoined) {
    return `${errorPathJoined} - ${firstError.message}`;
  }
  return firstError.message;
};

export const sendParsingError = <T>(error: ZodError<T>, res: Response) => {
  return res.status(400).send(parseToSingleError(error));
};
