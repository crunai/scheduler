import { Interval } from "luxon";
import { Schedule } from "../../../helper/query";
import {
  convertIntervalObjectToMillis,
  convertMillisToIntervalObject,
} from "../../../helper/interval";
import { convertPreferenceValuesToJSON, initPreference } from "./preference";

const mergeAllUserAvailabilities = (schedule: Schedule) => {
  let allMergedAvailabilities: Interval[] = [];

  for (const userAvailabilities of schedule.user_availabilities.values()) {
    const userIntervals = userAvailabilities.map(convertMillisToIntervalObject);
    allMergedAvailabilities = Interval.merge(
      allMergedAvailabilities.concat(userIntervals),
    );
  }
  return allMergedAvailabilities;
};

export const getNoneIntersection = (schedule: Schedule) => {
  const allMergedUserAvailabilities = mergeAllUserAvailabilities(schedule);
  const result = Interval.xor(
    allMergedUserAvailabilities.concat(
      schedule.allowable_time_range.map(convertMillisToIntervalObject),
    ),
  );
  return result.map((interval) => {
    return {
      interval: convertIntervalObjectToMillis(interval),
      numIntersection: 0,
      usersIntersecting: [],
      preference: convertPreferenceValuesToJSON(initPreference()),
    };
  });
};
