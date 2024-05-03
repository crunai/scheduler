import { setupTests } from "../testHelper";
import {
  addAvailabilities,
  login,
  scheduleDaysInWeek,
  scheduleSelectedDates,
} from "../routeWrapper";
import { DateTime } from "luxon";
import { createUTCDateTimeFromMillis } from "../../src/helper/timing";
import { PreferenceType } from "../../src/database";

describe("addAvailabilities route", () => {
  setupTests();
  const tz = "Asia/Colombo";

  test("Successful add availabilities for days in week", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", tz, [2])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    const res = await addAvailabilities(token, uuid, [
      {
        start: createUTCDateTimeFromMillis(0)
          .set({ weekday: 2, hour: 4 })
          .toMillis(),
        end: createUTCDateTimeFromMillis(0)
          .set({ weekday: 2, hour: 14 })
          .toMillis(),
        preference: PreferenceType.PREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(200);
  });

  test("Successful add availabilities for selected dates", async () => {
    const date = new Date("Apr 06 2024 23:00:00 UTC/GMT");
    const uuid = (await scheduleSelectedDates("weekend", tz, [date.getTime()]))
      .body.uuid;

    const token = (await login("john", uuid, "password")).body.token;
    const res = await addAvailabilities(token, uuid, [
      {
        start: DateTime.fromJSDate(date).setZone(tz).startOf("day").toMillis(),
        end: DateTime.fromJSDate(date)
          .setZone(tz)
          .endOf("day")
          .minus({
            minutes: 33,
          })
          .toMillis(),
        preference: PreferenceType.NOTPREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(200);
  });

  test("Add across days", async () => {
    const day1 = new Date("Apr 06 2024 23:00:00 UTC/GMT");
    const day2 = new Date("Apr 07 2024 23:00:00 UTC/GMT");

    const uuid = (
      await scheduleSelectedDates("weekend", "UTC", [
        day1.getTime(),
        day2.getTime(),
      ])
    ).body.uuid;

    const token = (await login("john", uuid, "password")).body.token;
    const res = await addAvailabilities(token, uuid, [
      {
        start: day1.getTime(),
        end: day2.getTime(),
        preference: PreferenceType.PREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(200);
  });

  test("Interval not within scheduled allowable time, fully outside", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", tz, [2], 5, 10)).body
      .uuid;
    const token = (await login("john", uuid, "password")).body.token;
    const res = await addAvailabilities(token, uuid, [
      {
        start: DateTime.fromJSDate(new Date())
          .set({ weekday: 2, hour: 3 })
          .toMillis(),
        end: DateTime.fromJSDate(new Date())
          .set({ weekday: 2, hour: 12 })
          .toMillis(),
        preference: PreferenceType.PREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(400);
  });

  test("Interval not within scheduled allowable time, one side outside", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", tz, [2], 5, 10)).body
      .uuid;
    const token = (await login("john", uuid, "password")).body.token;
    const res = await addAvailabilities(token, uuid, [
      {
        start: DateTime.fromJSDate(new Date())
          .set({ weekday: 2, hour: 7 })
          .toMillis(),
        end: DateTime.fromJSDate(new Date())
          .set({ weekday: 2, hour: 12 })
          .toMillis(),
        preference: PreferenceType.PREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(400);
  });

  test("Token does not exist", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", tz, [2])).body.uuid;
    const res = await addAvailabilities("token", uuid, [
      {
        start: createUTCDateTimeFromMillis(0)
          .set({ weekday: 2, hour: 4 })
          .toMillis(),
        end: createUTCDateTimeFromMillis(0)
          .set({ weekday: 2, hour: 14 })
          .toMillis(),
        preference: PreferenceType.PREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(401);
  });

  test("Schedule does not exist", async () => {
    const res = await addAvailabilities("token", "uuid", [
      {
        start: 0,
        end: 0,
        preference: PreferenceType.PREFERRED,
      },
    ]);
    expect(res.status).toStrictEqual(400);
  });
});
