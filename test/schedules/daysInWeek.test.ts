import { setupTests } from "../testHelper";
import { scheduleDaysInWeek } from "../routeWrapper";

describe("daysInWeek Scheduling route", () => {
  setupTests();

  test("New valid schedule", async () => {
    const res = await scheduleDaysInWeek(
      "D'may G, day",
      "Asia/Colombo",
      [6, 1, 1],
      0,
      24,
    );
    expect(res.status).toStrictEqual(200);
    expect(res.body.uuid).toStrictEqual(expect.any(String));
  });

  test("Invalid name", async () => {
    const res = await scheduleDaysInWeek(
      "This is $1 day",
      "Asia/Colombo",
      [6, 1],
    );
    expect(res.status).toStrictEqual(400);
  });

  test("Invalid timezone", async () => {
    const res = await scheduleDaysInWeek("Schedule", "America/Ocean", [6, 1]);
    expect(res.status).toStrictEqual(400);
  });

  test("Days not in bound", async () => {
    const lower = await scheduleDaysInWeek(
      "Schedule",
      "Asia/Colombo",
      [6, 0, 1],
    );
    expect(lower.status).toStrictEqual(400);

    const upper = await scheduleDaysInWeek(
      "Schedule",
      "Asia/Colombo",
      [6, 8, 1],
    );
    expect(upper.status).toStrictEqual(400);
  });

  test("Hours not in bound", async () => {
    const lower = await scheduleDaysInWeek(
      "Schedule",
      "Asia/Colombo",
      [6, 1],
      -1,
    );
    expect(lower.status).toStrictEqual(400);

    const upper = await scheduleDaysInWeek(
      "Schedule",
      "Asia/Colombo",
      [6, 1],
      undefined,
      25,
    );
    expect(upper.status).toStrictEqual(400);
  });

  test("Latest hour is greater than earliest hour", async () => {
    const lower = await scheduleDaysInWeek(
      "Schedule",
      "Asia/Colombo",
      [6, 1],
      6,
      2,
    );
    expect(lower.status).toStrictEqual(400);
  });
});
