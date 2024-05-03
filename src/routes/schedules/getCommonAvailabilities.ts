import { sendParsingError } from "../../helper/parsing";
import { z } from "zod";
import { Request, Response } from "express";
import { findSchedule } from "../../helper/query";
import { getIntersectionInfo } from "./availabilityAnalysis/intersection";
import { getNoneIntersection } from "./availabilityAnalysis/noIntersection";
import {
  convertPreferenceValuesToJSON,
  initPreference,
} from "./availabilityAnalysis/preference";
import { PreferenceType } from "../../database";

const schema = z.object({
  scheduleUUID: z.string(),
  sortByBest: z.coerce.boolean().default(false),
});

export const getCommonAvailabilities = async (req: Request, res: Response) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return sendParsingError(result.error, res);
  }

  const { scheduleUUID, sortByBest } = result.data;
  const scheduleQuery = await findSchedule(scheduleUUID, res);

  if (scheduleQuery.error) {
    return scheduleQuery.error;
  }

  const schedule = scheduleQuery.schedule;
  if (schedule.user_availabilities.size < 1) {
    return res.json(
      schedule.allowable_time_range
        .sort((a, b) => a.start - b.start)
        .map(({ start, end }) => {
          return {
            interval: { start, end },
            numIntersection: 0,
            usersIntersecting: [],
            preference: convertPreferenceValuesToJSON(initPreference()),
          };
        }),
    );
  }

  const intersection = getIntersectionInfo(schedule);
  const noneIntersection = getNoneIntersection(schedule);

  const allInfo = intersection.concat(noneIntersection).sort((a, b) => {
    const startTimeDifference =
      (a.interval.start ?? 0) - (b.interval.start ?? 0);
    if (!sortByBest) {
      return startTimeDifference;
    }

    const intersectionDifference = b.numIntersection - a.numIntersection;
    if (intersectionDifference !== 0) {
      return intersectionDifference;
    }

    for (const preferenceType of Object.keys(PreferenceType)
      .filter((num) => !isNaN(Number(num)))
      .sort((a, b) => Number(b) - Number(a))) {
      const preferenceDifference =
        (b.preference[preferenceType]?.length ?? 0) -
        (a.preference[preferenceType]?.length ?? 0);
      if (preferenceDifference !== 0) {
        return preferenceDifference;
      }
    }
    return startTimeDifference;
  });
  res.json(allInfo);
};
