import { setupTests } from "../testHelper";
import { scheduleSelectedDates } from "../routeWrapper";

describe("selectedDates Scheduling route", () => {
  setupTests();

  test("New valid schedule", async () => {
    const res = await scheduleSelectedDates(
      "D'may G, day",
      "UTC",
      [new Date("Apr 06 2024 06:00:00 UTC/GMT").getTime()],
      9,
      20,
    );
    expect(res.status).toStrictEqual(200);
    expect(res.body.uuid).toStrictEqual(expect.any(String));
  });

  test("Start of day is before UTC due to tz", async () => {
    const res = await scheduleSelectedDates("Schedule", "America/Dawson", [
      new Date("Apr 06 2024 06:00:00 UTC/GMT").getTime(),
    ]);
    expect(res.status).toStrictEqual(200);
  });

  test("Start of day is after UTC due to tz", async () => {
    const res = await scheduleSelectedDates("Schedule", "Antarctica/Vostok", [
      new Date("Apr 06 2024 22:00:00 UTC/GMT").getTime(),
    ]);
    expect(res.status).toStrictEqual(200);
  });

  test("Invalid tz", async () => {
    const res = await scheduleSelectedDates("Schedule", "Ocean", [0]);
    expect(res.status).toStrictEqual(400);
  });

  test("No timestamp", async () => {
    const res = await scheduleSelectedDates("golf", "Antarctica/Vostok", []);
    expect(res.status).toStrictEqual(400);
  });
});
