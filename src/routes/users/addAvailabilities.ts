import { sendParsingError, validUnixmsTime } from "../../helper/parsing";
import { z } from "zod";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { findScheduleAndUsername } from "../../helper/query";
import { PreferenceType, ScheduleType } from "../../database";
import {
  convertMillisToIntervalObject,
  withinIntervals,
} from "../../helper/interval";
import {
  convertPreferenceIntervalObjectToMillis,
  convertPreferenceMillisToIntervalObject,
  mapToDummyDayInWeekTime,
  preferenceIntervalMerge,
} from "../../helper/preferenceInterval";

const schema = z.object({
  scheduleUUID: z.string(),
  availabilities: z
    .object({
      start: z.number().refine(validUnixmsTime, "Must be valid unix ms"),
      end: z.number().refine(validUnixmsTime, "Must be valid unix ms"),
      preference: z.nativeEnum(PreferenceType),
    })
    .refine(
      (interval) => interval.end > interval.start,
      "End of interval must be later than start of interval",
    )
    .array(),
});

export const addAvailabilities = async (req: Request, res: Response) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return sendParsingError(result.error, res);
  }

  const scheduleUUID = result.data.scheduleUUID;
  let availabilities = result.data.availabilities;

  const query = await findScheduleAndUsername(
    scheduleUUID,
    req.headers.authorization,
    res,
  );

  if (query.error) {
    return query.error;
  }
  const { schedule, username } = query;

  if (schedule.type === ScheduleType.DAYSINWEEK) {
    availabilities = mapToDummyDayInWeekTime(availabilities);
  }

  const givenMergedAvailabilities = preferenceIntervalMerge(
    availabilities.map(convertPreferenceMillisToIntervalObject),
  );
  const allowableIntervals = schedule.allowable_time_range.map(
    convertMillisToIntervalObject,
  );
  if (
    !withinIntervals(
      givenMergedAvailabilities.map((prefInterval) => prefInterval.interval),
      allowableIntervals,
    )
  ) {
    return res
      .status(400)
      .send("Intervals provided are not within the schedule allowable time");
  }

  let resultingAvailabilities = givenMergedAvailabilities;
  const userAvailabilities = schedule.user_availabilities.get(username)!;
  resultingAvailabilities = preferenceIntervalMerge(
    givenMergedAvailabilities.concat(
      userAvailabilities.map(convertPreferenceMillisToIntervalObject),
    ),
  );

  schedule.user_availabilities.set(
    username,
    new Types.DocumentArray(
      resultingAvailabilities.map(convertPreferenceIntervalObjectToMillis),
    ),
  );

  await schedule.save();
  res.json({});
};
