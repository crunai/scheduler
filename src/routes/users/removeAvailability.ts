import { sendParsingError, validUnixmsTime } from "../../helper/parsing";
import { z } from "zod";
import { Request, Response } from "express";
import { Interval } from "luxon";
import { findScheduleAndUsername } from "../../helper/query";
import {
  convertMillisToIntervalObject,
  withinIntervals,
} from "../../helper/interval";
import {
  PreferenceInterval,
  convertPreferenceIntervalObjectToMillis,
  convertPreferenceMillisToIntervalObject,
  mapToDummyDayInWeekTime,
} from "../../helper/preferenceInterval";
import { PreferenceType, ScheduleType } from "../../database";

const schema = z.object({
  scheduleUUID: z.string(),
  availabilities: z
    .object({
      start: z.number().refine(validUnixmsTime, "Must be valid unix ms"),
      end: z.number().refine(validUnixmsTime, "Must be valid unix ms"),
    })
    .refine(
      (interval) => interval.end > interval.start,
      "End of interval must be later than start of interval",
    )
    .array(),
});

export const removeAvailability = async (req: Request, res: Response) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return sendParsingError(result.error, res);
  }

  const scheduleUUID = result.data.scheduleUUID;

  const query = await findScheduleAndUsername(
    scheduleUUID,
    req.headers.authorization,
    res,
  );

  if (query.error) {
    return query.error;
  }
  const { schedule, username } = query;

  let intervalsToRemove = result.data.availabilities;
  if (schedule.type === ScheduleType.DAYSINWEEK) {
    intervalsToRemove = mapToDummyDayInWeekTime(
      intervalsToRemove.map((interval) => {
        return {
          ...interval,
          preference: PreferenceType.NOTPREFERRED,
        };
      }),
    );
  }

  const intervalObjectsToRemove = Interval.merge(
    intervalsToRemove.map(convertMillisToIntervalObject),
  );

  const allowableIntervals = schedule.allowable_time_range.map(
    convertMillisToIntervalObject,
  );
  if (!withinIntervals(intervalObjectsToRemove, allowableIntervals)) {
    return res
      .status(400)
      .send("Intervals provided are not within the schedule allowable time");
  }

  const userAvailabilities = schedule.user_availabilities.get(username)!;

  for (const intervalObjectToRemove of intervalObjectsToRemove) {
    const userAvailabilitiesAfterRemoval: PreferenceInterval[] = [];
    for (const userAvailability of userAvailabilities.map(
      convertPreferenceMillisToIntervalObject,
    )) {
      const newAvailability = userAvailability.interval.difference(
        intervalObjectToRemove,
      );
      userAvailabilitiesAfterRemoval.push(
        ...newAvailability.map((interval) => {
          return {
            interval,
            preference: userAvailability.preference,
          };
        }),
      );
    }
    // Clear existing
    userAvailabilities.splice(0, userAvailabilities.length);
    userAvailabilities.push(
      ...userAvailabilitiesAfterRemoval.map(
        convertPreferenceIntervalObjectToMillis,
      ),
    );
  }

  userAvailabilities.sort((a, b) => a.start - b.start);

  await schedule.save();
  res.json({});
};
