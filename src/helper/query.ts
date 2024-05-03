import { Response } from "express";
import { SchedulesCollection } from "../database";
import { getAuthToken } from "./encryption";

export const findSchedule = async (scheduleUUID: string, res: Response) => {
  const schedule = await SchedulesCollection.findOne({
    uuid: { $eq: scheduleUUID },
  });
  if (!schedule) {
    return { error: res.status(400).send("Schedule UUID is invalid") };
  }
  return { schedule };
};

export const findScheduleAndUsername = async (
  scheduleUUID: string,
  authorization: unknown,
  res: Response,
) => {
  const scheduleQuery = await findSchedule(scheduleUUID, res);
  if (scheduleQuery.error) {
    return { error: scheduleQuery.error };
  }
  const schedule = scheduleQuery.schedule;

  const tokenQuery = getAuthToken(authorization, res);
  if (tokenQuery.error) {
    return { error: tokenQuery.error };
  }
  const token = tokenQuery.token;

  for (const [username, { tokens }] of schedule.user_info.entries()) {
    if (tokens.includes(token)) {
      return { username, schedule };
    }
  }
  return { error: res.status(401).send("Token is invalid") };
};

const getScheduleFunc = () => {
  return SchedulesCollection.findOne({});
};

export type Schedule = Awaited<ReturnType<typeof getScheduleFunc>> & object;
