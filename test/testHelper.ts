import mongoose from "mongoose";
import {
  LogsCollection,
  PreferenceType,
  SchedulesCollection,
  connectMongoose,
} from "../src/database";
import {
  createUTCDateTimeFromMillis,
  getDummyOffsetUnix,
} from "../src/helper/timing";
import { WeekdayNumbers } from "luxon";
import {
  convertPreferenceValuesToJSON,
  initPreference,
} from "../src/routes/schedules/availabilityAnalysis/preference";

export const clearDb = async () => {
  await SchedulesCollection.deleteMany({});
  await LogsCollection.deleteMany({});
};

export const setupTests = () => {
  beforeAll(async () => {
    await connectMongoose();
  });

  beforeEach(async () => {
    await clearDb();
  });

  afterAll(() => {
    mongoose.connection.close();
  });
};

export const createDummyHelperTime = (
  hour: number,
  day?: number,
  weekday?: WeekdayNumbers,
) => {
  if (weekday) {
    return createUTCDateTimeFromMillis(0)
      .set({ hour })
      .plus(getDummyOffsetUnix().toMillis())
      .set({ weekday })
      .toMillis();
  }
  return createUTCDateTimeFromMillis(0).set({ hour }).plus({ day }).toMillis();
};

export const createDummyHelperInterval = (
  startHour: number,
  endHour: number,
  day?: number,
  weekday?: WeekdayNumbers,
) => {
  return {
    start: createDummyHelperTime(startHour, day, weekday),
    end: createDummyHelperTime(endHour, day, weekday),
  };
};

export const createDummyPreferenceHelperInterval = (
  startHour: number,
  endHour: number,
  day?: number,
  weekday?: WeekdayNumbers,
  preference?: PreferenceType,
) => {
  return {
    start: createDummyHelperTime(startHour, day, weekday),
    end: createDummyHelperTime(endHour, day, weekday),
    preference: preference ?? PreferenceType.PREFERRED,
  };
};

export const transformAvailabilityValuesToSet = (info: {
  usersIntersecting: string;
  interval: { start: number; end: number };
  numIntersection: number;
  preference: ReturnType<typeof convertPreferenceValuesToJSON>;
}) => {
  return {
    ...info,
    usersIntersecting: new Set(info.usersIntersecting),
    preference: setPreferenceJSONToSet(info.preference),
  };
};

export const createDummyIntervalInfo = (
  startHour: number,
  endHour: number,
  users: string[],
  day?: number,
  preference?: Map<number, Set<string>>,
) => {
  return {
    interval: createDummyHelperInterval(startHour, endHour, day),
    numIntersection: users.length,
    usersIntersecting: new Set(users),
    preference:
      preference ??
      initPreference().set(PreferenceType.PREFERRED, new Set(users)),
  };
};

export const setPreferenceJSONToSet = (
  preference: ReturnType<typeof convertPreferenceValuesToJSON>,
) => {
  const result = new Map<number, Set<string>>();
  for (const key in preference) {
    result.set(Number(key), new Set(preference[key]));
  }
  return result;
};
