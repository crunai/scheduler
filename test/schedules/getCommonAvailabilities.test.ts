import {
  createDummyHelperTime,
  createDummyIntervalInfo,
  createDummyPreferenceHelperInterval,
  setPreferenceJSONToSet,
  setupTests,
  transformAvailabilityValuesToSet,
} from "../testHelper";
import {
  addAvailabilities,
  getCommonAvailabilities,
  login,
  scheduleSelectedDates,
} from "../routeWrapper";
import {
  convertPreferenceValuesToJSON,
  initPreference,
} from "../../src/routes/schedules/availabilityAnalysis/preference";

describe("get common availabilities route", () => {
  setupTests();

  test("None in schedule", async () => {
    const uuid = (
      await scheduleSelectedDates(
        "Schedule",
        "UTC",
        [0, createDummyHelperTime(0, 20), createDummyHelperTime(0, 10)],
        9,
        20,
      )
    ).body.uuid;
    const res = await getCommonAvailabilities(uuid);
    expect(res.body.map(transformAvailabilityValuesToSet)).toStrictEqual([
      createDummyIntervalInfo(9, 20, []),
      createDummyIntervalInfo(9, 20, [], 10),
      createDummyIntervalInfo(9, 20, [], 20),
    ]);
  });

  test("Simple 1 person schedule", async () => {
    const uuid = (await scheduleSelectedDates("Schedule", "UTC", [0], 9, 20))
      .body.uuid;
    const token = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(token, uuid, [
      createDummyPreferenceHelperInterval(13, 15),
    ]);
    const res = await getCommonAvailabilities(uuid);
    expect(res.body.map(transformAvailabilityValuesToSet)).toStrictEqual([
      createDummyIntervalInfo(9, 13, []),
      createDummyIntervalInfo(13, 15, ["John"]),
      createDummyIntervalInfo(15, 20, []),
    ]);
  });

  test("Complex multiple people schedule", async () => {
    const uuid = (await scheduleSelectedDates("Schedule", "UTC", [0])).body
      .uuid;

    const tokenJohn = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(tokenJohn, uuid, [
      createDummyPreferenceHelperInterval(11, 15),
    ]);
    const tokenBob = (await login("Bob", uuid, "password")).body.token;
    await addAvailabilities(tokenBob, uuid, [
      createDummyPreferenceHelperInterval(9, 13),
      createDummyPreferenceHelperInterval(16, 22),
    ]);
    const tokenRob = (await login("Rob", uuid, "password")).body.token;
    await addAvailabilities(tokenRob, uuid, [
      createDummyPreferenceHelperInterval(12, 18),
    ]);

    const res = await getCommonAvailabilities(uuid);
    expect(res.body.map(transformAvailabilityValuesToSet)).toStrictEqual([
      createDummyIntervalInfo(0, 9, []),
      createDummyIntervalInfo(9, 11, ["Bob"]),
      createDummyIntervalInfo(11, 12, ["John", "Bob"]),
      createDummyIntervalInfo(12, 13, ["John", "Rob", "Bob"]),
      createDummyIntervalInfo(13, 15, ["John", "Rob"]),
      createDummyIntervalInfo(15, 16, ["Rob"]),
      createDummyIntervalInfo(16, 18, ["Rob", "Bob"]),
      createDummyIntervalInfo(18, 22, ["Bob"]),
      createDummyIntervalInfo(22, 24, []),
    ]);
  });

  test("Complex multiple people schedule across days", async () => {
    const uuid = (
      await scheduleSelectedDates("Schedule", "UTC", [
        0,
        createDummyHelperTime(0, 1),
      ])
    ).body.uuid;

    const tokenJohn = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(tokenJohn, uuid, [
      createDummyPreferenceHelperInterval(11, 15),
      createDummyPreferenceHelperInterval(23, 24, 1),
    ]);
    const tokenBob = (await login("Bob", uuid, "password")).body.token;
    await addAvailabilities(tokenBob, uuid, [
      createDummyPreferenceHelperInterval(9, 13),
      createDummyPreferenceHelperInterval(13, 22, 1),
    ]);
    const tokenRob = (await login("Rob", uuid, "password")).body.token;
    await addAvailabilities(tokenRob, uuid, [
      createDummyPreferenceHelperInterval(11, 15, 1),
    ]);

    const res = await getCommonAvailabilities(uuid);
    expect(res.body.map(transformAvailabilityValuesToSet)).toStrictEqual([
      createDummyIntervalInfo(0, 9, []),
      createDummyIntervalInfo(9, 11, ["Bob"]),
      createDummyIntervalInfo(11, 13, ["John", "Bob"]),
      createDummyIntervalInfo(13, 15, ["John"]),
      {
        interval: {
          start: createDummyHelperTime(15),
          end: createDummyHelperTime(11, 1),
        },
        numIntersection: 0,
        usersIntersecting: new Set(),
        preference: setPreferenceJSONToSet(
          convertPreferenceValuesToJSON(initPreference()),
        ),
      },
      createDummyIntervalInfo(11, 13, ["Rob"], 1),
      createDummyIntervalInfo(13, 15, ["Rob", "Bob"], 1),
      createDummyIntervalInfo(15, 22, ["Bob"], 1),
      createDummyIntervalInfo(22, 23, [], 1),
      createDummyIntervalInfo(23, 24, ["John"], 1),
    ]);
  });
});
