import { randomUUID } from "crypto";
import { sanitiseString, sendParsingError } from "../../helper/parsing";
import { z } from "zod";
import { Request, Response } from "express";
import { checkSamePassword, createNewScryptKey } from "../../helper/encryption";
import { findSchedule } from "../../helper/query";
import { Types } from "mongoose";

const schema = z.object({
  name: z.string().transform(sanitiseString),
  scheduleUUID: z.string(),
  password: z.string(),
});

export const login = async (req: Request, res: Response) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return sendParsingError(result.error, res);
  }

  const { name, scheduleUUID, password } = result.data;
  const scheduleQuery = await findSchedule(scheduleUUID, res);

  if (scheduleQuery.error) {
    return scheduleQuery.error;
  }
  const schedule = scheduleQuery.schedule;

  const userInfo = schedule.user_info.get(name);
  const token = String(randomUUID());
  try {
    if (userInfo) {
      const isSamePassword = checkSamePassword(
        password,
        userInfo.salt,
        userInfo.scrypt_derived_key,
      );
      if (!isSamePassword) {
        return res.status(400).send("Incorrect password");
      }
      userInfo.tokens.push(token);
    } else {
      const scryptResult = createNewScryptKey(password);
      schedule.user_info.set(name, {
        scrypt_derived_key: scryptResult.scryptDerivedKey,
        tokens: [token],
        salt: scryptResult.salt,
      });
      schedule.user_availabilities.set(name, new Types.DocumentArray([]));
    }
  } catch (error) {
    return res.status(500).send("Something went wrong during key derivation");
  }

  await schedule.save();
  res.json({ token });
};
