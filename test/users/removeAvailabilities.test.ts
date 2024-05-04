import {
  createDummyHelperInterval,
  createDummyPreferenceHelperInterval,
  setupTests,
} from "../testHelper";
import {
  addAvailabilities,
  info,
  login,
  removeAvailabilities,
  scheduleDaysInWeek,
  scheduleSelectedDates,
} from "../routeWrapper";
import { DateTime } from "luxon";
import { PreferenceType } from "../../src/database";

describe("removeAvailabilities route", () => {
  setupTests();

  test("Fail to remove availability outside of schedule", async () => {
    const uuid = (await scheduleSelectedDates("weekend", "UTC", [0])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    const res = await removeAvailabilities(token, uuid, [
      createDummyHelperInterval(14, 17, 1),
    ]);
    expect(res.status).toStrictEqual(400);
  });

  test("Delete entire valid availability", async () => {
    const uuid = (await scheduleSelectedDates("weekend", "UTC", [0])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    const res = await removeAvailabilities(token, uuid, [
      createDummyHelperInterval(12, 15),
    ]);
    expect(res.status).toStrictEqual(200);
    const infoRes = await info(uuid);
    expect(infoRes.body.user_availabilities.john).toStrictEqual([]);
  });

  test("Delete partial valid availability - creating 1 new interval", async () => {
    const uuid = (await scheduleSelectedDates("weekend", "UTC", [0])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    const res = await removeAvailabilities(token, uuid, [
      createDummyHelperInterval(14, 15),
    ]);
    expect(res.status).toStrictEqual(200);

    const infoRes = await info(uuid);
    expect(infoRes.body.user_availabilities.john).toStrictEqual([
      createDummyPreferenceHelperInterval(12, 14),
    ]);
  });

  test("Delete partial valid availability - creating 2 new interval", async () => {
    const uuid = (await scheduleSelectedDates("weekend", "UTC", [0])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    const res = await removeAvailabilities(token, uuid, [
      createDummyHelperInterval(13, 14),
    ]);
    expect(res.status).toStrictEqual(200);

    const infoRes = await info(uuid);
    expect(new Set(infoRes.body.user_availabilities.john)).toStrictEqual(
      new Set([
        createDummyPreferenceHelperInterval(12, 13),
        createDummyPreferenceHelperInterval(14, 15),
      ]),
    );
  });

  test("Can remove parts with no availabilities", async () => {
    const uuid = (await scheduleSelectedDates("weekend", "UTC", [0])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    const res = await removeAvailabilities(token, uuid, [
      createDummyHelperInterval(14, 18),
    ]);
    expect(res.status).toStrictEqual(200);

    const infoRes = await info(uuid);
    expect(new Set(infoRes.body.user_availabilities.john)).toStrictEqual(
      new Set([createDummyPreferenceHelperInterval(12, 14)]),
    );
  });

  test("Remove relative in days in week schedule", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", "UTC", [1])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      {
        start: DateTime.utc(1980).set({ weekday: 1, hour: 9 }).toMillis(),
        end: DateTime.utc(2010).set({ weekday: 1, hour: 13 }).toMillis(),
        preference: PreferenceType.PREFERRED,
      },
    ]);
    const res = await removeAvailabilities(token, uuid, [
      {
        start: DateTime.utc(1990).set({ weekday: 1, hour: 9 }).toMillis(),
        end: DateTime.utc(2020).set({ weekday: 1, hour: 13 }).toMillis(),
      },
    ]);
    expect(res.status).toStrictEqual(200);
  });

  test("Invalid token and schedule", async () => {
    const res = await removeAvailabilities("token", "uuid", [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    expect(res.status).toStrictEqual(400);
  });

  test("Invalid token", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", "UTC", [1])).body.uuid;
    const res = await removeAvailabilities("", uuid, [
      createDummyPreferenceHelperInterval(12, 15),
    ]);
    expect(res.status).toStrictEqual(401);
  });

  test("Start and end is same", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", "UTC", [1])).body.uuid;
    const token = (await login("john", uuid, "password")).body.token;
    const res = await removeAvailabilities(token, uuid, [
      {
        start: 0,
        end: 0,
      },
    ]);
    expect(res.status).toStrictEqual(400);
  });
});
