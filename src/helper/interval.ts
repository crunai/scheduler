import { Interval } from "luxon";
import { createUTCDateTimeFromMillis } from "./timing";

export const convertMillisToIntervalObject = ({
  start,
  end,
}: {
  start: number;
  end: number;
}) => {
  return Interval.fromDateTimes(
    createUTCDateTimeFromMillis(start),
    createUTCDateTimeFromMillis(end),
  );
};

export const convertIntervalObjectToMillis = (interval: Interval) => {
  return {
    start: interval.start?.toMillis() ?? 0,
    end: interval.end?.toMillis() ?? 0,
  };
};

export const mergeMillisIntervals = (
  intervals: { start: number; end: number }[],
) => {
  return Interval.merge(intervals.map(convertMillisToIntervalObject)).map(
    convertIntervalObjectToMillis,
  );
};

export const withinIntervals = (
  checkedIntervals: Interval[],
  allowableIntervals: Interval[],
) => {
  for (const checkedInterval of checkedIntervals) {
    if (
      !allowableIntervals.find((interval) => interval.engulfs(checkedInterval))
    ) {
      return false;
    }
  }
  return true;
};
