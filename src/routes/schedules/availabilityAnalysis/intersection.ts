import { Interval } from "luxon";
import { Schedule } from "../../../helper/query";
import {
  convertIntervalObjectToMillis,
  convertMillisToIntervalObject,
} from "../../../helper/interval";
import { PreferenceType } from "../../../database";
import { convertPreferenceMillisToIntervalObject } from "../../../helper/preferenceInterval";
import {
  convertPreferenceValuesToJSON,
  getCopy,
  initPreference,
} from "./preference";

export const getIntersectionInfo = (schedule: Schedule) => {
  const intersectionInfo = getAllIntersectionInfo(schedule);
  const maximalIntersection = mergeOnMaximalIntersection(intersectionInfo);
  const finalIntersectionInfo =
    reduceIntersectionToLargestSet(maximalIntersection);

  return finalIntersectionInfo.map((info) => {
    return {
      interval: convertIntervalObjectToMillis(info.interval),
      numIntersection: info.usersIntersecting.size,
      usersIntersecting: Array.from(info.usersIntersecting),
      preference: convertPreferenceValuesToJSON(info.preference),
    };
  });
};

type StackIntervalElem = {
  interval: Interval;
  visited: string[];
  usersIntersecting: Set<string>;
  preference: Map<PreferenceType, Set<string>>;
};

const initStack = (schedule: Schedule) => {
  const stack: StackIntervalElem[] = [];
  const [firstUsername, firstUserAvailabilities] = schedule.user_availabilities
    .entries()
    .next().value;
  const preference = initPreference();
  for (const firstUserAvailability of firstUserAvailabilities) {
    stack.push({
      interval: convertMillisToIntervalObject(firstUserAvailability),
      visited: [firstUsername],
      usersIntersecting: new Set([firstUsername]),
      preference: preference.set(
        firstUserAvailability.preference,
        new Set([firstUsername]),
      ),
    });
  }
  return stack;
};

const getAllIntersectionInfo = (schedule: Schedule) => {
  const stack = initStack(schedule);
  const intersectionInfo: StackIntervalElem[] = [];

  while (stack.length !== 0) {
    const currentIntersection = stack.pop() as StackIntervalElem;
    if (
      currentIntersection.visited.length === schedule.user_availabilities.size
    ) {
      intersectionInfo.push(currentIntersection);
      continue;
    }

    for (const username of schedule.user_availabilities.keys()) {
      if (currentIntersection.visited.includes(username)) continue;

      const userAvailabilities =
        schedule.user_availabilities
          .get(username)
          ?.map(convertPreferenceMillisToIntervalObject) ?? [];

      for (const newUserAvailability of userAvailabilities) {
        const visitedCopy = [...currentIntersection.visited, username];
        const newIntersection = currentIntersection.interval.intersection(
          newUserAvailability.interval,
        );
        if (!newIntersection) {
          intersectionInfo.push(currentIntersection);
          stack.push({
            interval: newUserAvailability.interval,
            visited: visitedCopy,
            usersIntersecting: new Set([username]),
            preference: initPreference().set(
              newUserAvailability.preference,
              new Set([username]),
            ),
          });
          continue;
        }
        const intersectionOverhangs = Interval.xor([
          newIntersection,
          currentIntersection.interval,
          newUserAvailability.interval,
        ]);
        for (const overhang of intersectionOverhangs) {
          let usersIntersecting = new Set<string>();
          let preference = new Map();
          if (newUserAvailability.interval.engulfs(overhang)) {
            usersIntersecting = new Set([username]);
            preference = initPreference().set(
              newUserAvailability.preference,
              new Set([username]),
            );
          } else if (currentIntersection.interval.engulfs(overhang)) {
            usersIntersecting = new Set(currentIntersection.usersIntersecting);
            preference = getCopy(currentIntersection.preference);
          }
          stack.push({
            interval: overhang,
            visited: visitedCopy,
            usersIntersecting,
            preference,
          });
        }

        const preferenceCopy = getCopy(currentIntersection.preference);
        preferenceCopy.get(newUserAvailability.preference)?.add(username);
        stack.push({
          interval: newIntersection,
          visited: visitedCopy,
          usersIntersecting: new Set([
            ...currentIntersection.usersIntersecting,
            username,
          ]),
          preference: preferenceCopy,
        });
      }
    }
  }
  return intersectionInfo;
};

const mergeOnMaximalIntersection = (intersectionInfo: StackIntervalElem[]) => {
  const maxIntervalTracker = new Map<string, StackIntervalElem>();
  for (const info of intersectionInfo) {
    const intervalIdentifier = info.interval.toISO();
    const existingInterval = maxIntervalTracker.get(intervalIdentifier);
    if (
      !existingInterval ||
      info.usersIntersecting.size > existingInterval.usersIntersecting.size
    ) {
      maxIntervalTracker.set(intervalIdentifier, info);
    }
  }
  return Array.from(maxIntervalTracker.values());
};

const reduceIntersectionToLargestSet = (
  intersectionInfo: StackIntervalElem[],
) => {
  let canFindBetterIntervals = true;
  while (canFindBetterIntervals) {
    canFindBetterIntervals = false;
    const copy = new Map<string, StackIntervalElem>();
    for (const info of intersectionInfo) {
      const betterInterval = intersectionInfo.find((interval) =>
        isSmallerInterval(info, interval),
      );
      if (betterInterval) {
        copy.set(betterInterval.interval.toISO(), betterInterval);
        canFindBetterIntervals = true;
      } else {
        copy.set(info.interval.toISO(), info);
      }
    }
    intersectionInfo = Array.from(copy.values());
  }
  return intersectionInfo;
};

const isSmallerInterval = (
  current: StackIntervalElem,
  candidate: StackIntervalElem,
): boolean => {
  const currentStart = current.interval.start?.toMillis() ?? 0;
  const currentEnd = current.interval.end?.toMillis() ?? 0;
  const candidateStart = candidate.interval.start?.toMillis() ?? 0;
  const candidateEnd = candidate.interval.end?.toMillis() ?? 0;

  return (
    (candidateEnd === currentEnd && candidateStart > currentStart) ||
    (candidateStart === currentStart && candidateEnd < currentEnd)
  );
};
