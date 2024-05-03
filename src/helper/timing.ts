import { DateTime } from "luxon";

export const checkTimezone = (tz: string) => {
  return DateTime.fromMillis(0).setZone(tz).isValid;
};

export const generateDummyWeekTimeRange = (
  days: Set<number>,
  earliestHour: number,
  latestHour: number,
) => {
  let dayIterator = getDummyOffsetUnix();
  const timeRange = [];

  while (timeRange.length !== days.size) {
    if (days.has(dayIterator.weekday)) {
      const start = dayIterator.plus({ hours: earliestHour });
      const end = dayIterator.plus({ hours: latestHour });
      timeRange.push({
        start: start.toMillis(),
        end: end.toMillis(),
      });
    }
    dayIterator = incrementDay(dayIterator);
  }

  return timeRange;
};

const incrementDay = (date: DateTime) => {
  return date.plus({ day: 1 });
};

export const generateTimeRange = (
  dates: Set<DateTime>,
  earliestHour: number,
  latestHour: number,
  tz: string,
) => {
  const timeRange = [];
  const addedStarts = new Set();

  for (const day of dates) {
    const dayStart = day.setZone(tz).startOf("day");
    if (addedStarts.has(dayStart.toMillis())) {
      continue;
    }
    addedStarts.add(dayStart.toMillis());
    const start = dayStart.plus({ hours: earliestHour });
    const end = dayStart.plus({ hours: latestHour });
    timeRange.push({
      start: start.toMillis(),
      end: end.toMillis(),
    });
  }

  return timeRange;
};

export const createUTCDateTimeFromMillis = (millis: number) => {
  return DateTime.fromMillis(millis, { zone: "utc" });
};

export const getDummyOffsetUnix = () => {
  let offset = createUTCDateTimeFromMillis(0);
  while (offset.weekdayLong !== "Monday") {
    offset = incrementDay(offset);
  }

  return offset;
};

export const getOffsetWeek = (ms: number) => {
  const date = createUTCDateTimeFromMillis(ms);
  return date.minus(date.startOf("week").toMillis());
};
