import { Interval } from "luxon";
import { PreferenceType } from "../database";
import {
  convertIntervalObjectToMillis,
  convertMillisToIntervalObject,
} from "./interval";
import { getDummyOffsetUnix, getOffsetWeek } from "./timing";

export interface PreferenceInterval {
  interval: Interval;
  preference: PreferenceType;
}

interface PreferenceIntervalMillis {
  start: number;
  end: number;
  preference: PreferenceType;
}

export const convertPreferenceMillisToIntervalObject = ({
  start,
  end,
  preference,
}: PreferenceIntervalMillis) => {
  return {
    interval: convertMillisToIntervalObject({ start, end }),
    preference,
  };
};

export const convertPreferenceIntervalObjectToMillis = ({
  interval,
  preference,
}: PreferenceInterval) => {
  return {
    ...convertIntervalObjectToMillis(interval),
    preference,
  };
};

// Merge only if same preference
// Modified from luxon source
const preferenceIntervalMergeSamePreference = (
  preferenceIntervals: PreferenceInterval[],
) => {
  const [found, final] = sortPreferenceInterval(
    preferenceIntervals,
    false,
  ).reduce<[PreferenceInterval[], PreferenceInterval | null]>(
    ([sofar, current], item) => {
      if (!current) {
        return [sofar, item];
      } else if (
        (current.interval.overlaps(item.interval) ||
          current.interval.abutsStart(item.interval)) &&
        current.preference === item.preference
      ) {
        return [
          sofar,
          {
            interval: current.interval.union(item.interval),
            preference: current.preference,
          },
        ];
      } else {
        return [sofar.concat([current]), item];
      }
    },
    [[], null],
  );
  if (final) {
    found.push(final);
  }
  return found;
};

// If intersection, intersection is part of lowest preference interval
export const preferenceIntervalMerge = (
  preferenceIntervals: PreferenceInterval[],
) => {
  const minStack = preferenceIntervals.map(copyPreferenceInterval);
  sortPreferenceInterval(minStack, false).reverse();

  const result: PreferenceInterval[] = [];
  while (minStack.length > 1) {
    const preferenceInterval = minStack.pop() as PreferenceInterval;
    const nextInterval = minStack[minStack.length - 1] as PreferenceInterval;
    const intersection = preferenceIntervalIntersection(
      preferenceInterval,
      nextInterval,
    );

    if (!intersection) {
      result.push(preferenceInterval);
      continue;
    }
    const [leastPreferred, mostPreferred] = sortPreferenceInterval([
      preferenceInterval,
      nextInterval,
    ]);

    const newSlicedIntervals: PreferenceInterval[] = (
      mostPreferred?.interval as Interval
    )
      .difference(intersection.intersection)
      .map((interval) => {
        return {
          interval,
          preference: mostPreferred?.preference as PreferenceType,
        };
      });

    // Remove compared interval
    minStack.pop();
    // Add intervals back, ordered by start
    const resultingIntervals = sortPreferenceInterval(
      [leastPreferred as PreferenceInterval].concat(newSlicedIntervals),
      false,
    );
    addIntervalsToMinStack(minStack, resultingIntervals);
  }

  if (minStack.length !== 0) {
    result.push(minStack.pop() as PreferenceInterval);
  }

  return preferenceIntervalMergeSamePreference(result);
};

const addIntervalsToMinStack = (
  minStack: PreferenceInterval[],
  resultingIntervals: PreferenceInterval[],
) => {
  if (minStack.length === 0) {
    minStack.push(...resultingIntervals.reverse());
    return;
  }
  for (const preferenceInterval of resultingIntervals) {
    let i = minStack.length - 1;
    for (i; i >= 0; i--) {
      if (
        (preferenceInterval.interval.start?.toMillis() ?? 0) <=
        (minStack[i]?.interval.start?.toMillis() ?? 0)
      ) {
        minStack.splice(i, 0, preferenceInterval);
        break;
      }
    }
    if (i === -1) minStack.unshift(preferenceInterval);
  }
};

export const copyPreferenceInterval = (
  preferenceInterval: PreferenceInterval,
) => {
  return convertPreferenceMillisToIntervalObject(
    convertPreferenceIntervalObjectToMillis(preferenceInterval),
  );
};

export const preferenceIntervalIntersection = (
  preferenceIntervalA: PreferenceInterval,
  preferenceIntervalB: PreferenceInterval,
) => {
  const intervalA = preferenceIntervalA.interval;
  const intervalB = preferenceIntervalB.interval;

  const intersection = intervalA.intersection(intervalB);
  if (intersection) {
    return {
      intersection,
      // Get lowest preference
      preference: sortPreferenceInterval([
        preferenceIntervalA,
        preferenceIntervalB,
      ])[0]?.preference,
    };
  }
  return null;
};

// Sort by preference or start time
export const sortPreferenceInterval = (
  preferenceIntervals: PreferenceInterval[],
  sortByPreference: boolean = true,
) => {
  if (sortByPreference) {
    return preferenceIntervals.sort((a, b) => a.preference - b.preference);
  }
  return preferenceIntervals.sort(
    (a, b) =>
      (a.interval.start?.toMillis() ?? 0) - (b.interval.start?.toMillis() ?? 0),
  );
};

export const mapToDummyDayInWeekTime = (
  intervals: PreferenceIntervalMillis[],
) => {
  const dummyOffsetUnix = getDummyOffsetUnix();
  return intervals.map((interval) => {
    const startWeekOffset = getOffsetWeek(interval.start);
    const endWeekOffset = getOffsetWeek(interval.end);
    return {
      start: startWeekOffset.plus(dummyOffsetUnix.toMillis()).toMillis(),
      end: endWeekOffset.plus(dummyOffsetUnix.toMillis()).toMillis(),
      preference: interval.preference,
    };
  });
};
