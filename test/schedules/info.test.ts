import {
  createDummyHelperInterval,
  createDummyPreferenceHelperInterval,
  setupTests,
} from "../testHelper";
import {
  addAvailabilities,
  info,
  login,
  scheduleDaysInWeek,
  scheduleSelectedDates,
} from "../routeWrapper";
import { ScheduleType } from "../../src/database";

describe("schedule info route", () => {
  setupTests();

  test("Selected Dates", async () => {
    const uuid = (await scheduleSelectedDates("Schedule", "UTC", [0], 9, 20))
      .body.uuid;
    const res = await info(uuid);
    expect(res.body).toStrictEqual({
      schedule_name: "Schedule",
      type: ScheduleType.SELECTEDDATES,
      allowable_time_range: [createDummyHelperInterval(9, 20)],
      timezone: "UTC",
      user_availabilities: {},
    });
  });

  test("Days in Week", async () => {
    const uuid = (await scheduleDaysInWeek("Schedule", "UTC", [1, 2], 9, 20))
      .body.uuid;
    const token = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(11, 15, undefined, 1),
    ]);
    const res = await info(uuid);
    expect(res.body).toStrictEqual({
      schedule_name: "Schedule",
      type: ScheduleType.DAYSINWEEK,
      allowable_time_range: [
        createDummyHelperInterval(9, 20, undefined, 1),
        createDummyHelperInterval(9, 20, undefined, 2),
      ],
      timezone: "UTC",
      user_availabilities: {
        John: [createDummyPreferenceHelperInterval(11, 15, undefined, 1)],
      },
    });
  });
});
