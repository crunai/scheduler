import { PreferenceType } from "../../src/database";
import { initPreference } from "../../src/routes/schedules/availabilityAnalysis/preference";
import {
  addAvailabilities,
  getCommonAvailabilities,
  info,
  login,
  removeAvailabilities,
  scheduleSelectedDates,
} from "../routeWrapper";
import {
  createDummyHelperInterval,
  createDummyIntervalInfo,
  createDummyPreferenceHelperInterval,
  setupTests,
  transformAvailabilityValuesToSet,
} from "../testHelper";

describe("Misc preference testing", () => {
  setupTests();

  test("Schedule with different preferences", async () => {
    const uuid = (await scheduleSelectedDates("Schedule", "UTC", [0])).body
      .uuid;

    const tokenJohn = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(tokenJohn, uuid, [
      createDummyPreferenceHelperInterval(
        11,
        15,
        undefined,
        undefined,
        PreferenceType.NOTPREFERRED,
      ),
    ]);
    const tokenBob = (await login("Bob", uuid, "password")).body.token;
    await addAvailabilities(tokenBob, uuid, [
      createDummyPreferenceHelperInterval(9, 13),
      createDummyPreferenceHelperInterval(16, 22),
    ]);
    const tokenRob = (await login("Rob", uuid, "password")).body.token;
    await addAvailabilities(tokenRob, uuid, [
      createDummyPreferenceHelperInterval(
        12,
        18,
        undefined,
        undefined,
        PreferenceType.NOTPREFERRED,
      ),
    ]);

    const res = await getCommonAvailabilities(uuid, true);
    expect(res.body.map(transformAvailabilityValuesToSet)).toStrictEqual([
      createDummyIntervalInfo(
        12,
        13,
        ["John", "Rob", "Bob"],
        undefined,
        initPreference()
          .set(PreferenceType.NOTPREFERRED, new Set(["John", "Rob"]))
          .set(PreferenceType.PREFERRED, new Set(["Bob"])),
      ),
      createDummyIntervalInfo(
        11,
        12,
        ["John", "Bob"],
        undefined,
        initPreference()
          .set(PreferenceType.NOTPREFERRED, new Set(["John"]))
          .set(PreferenceType.PREFERRED, new Set(["Bob"])),
      ),
      createDummyIntervalInfo(
        16,
        18,
        ["Rob", "Bob"],
        undefined,
        initPreference()
          .set(PreferenceType.NOTPREFERRED, new Set(["Rob"]))
          .set(PreferenceType.PREFERRED, new Set(["Bob"])),
      ),
      createDummyIntervalInfo(
        13,
        15,
        ["John", "Rob"],
        undefined,
        initPreference().set(
          PreferenceType.NOTPREFERRED,
          new Set(["Rob", "John"]),
        ),
      ),
      createDummyIntervalInfo(9, 11, ["Bob"]),
      createDummyIntervalInfo(18, 22, ["Bob"]),
      createDummyIntervalInfo(
        15,
        16,
        ["Rob"],
        undefined,
        initPreference().set(PreferenceType.NOTPREFERRED, new Set(["Rob"])),
      ),
      createDummyIntervalInfo(0, 9, []),
      createDummyIntervalInfo(22, 24, []),
    ]);
  });

  test("Availabilities with different preferences don't merge", async () => {
    const uuid = (await scheduleSelectedDates("Schedule", "UTC", [0])).body
      .uuid;

    const tokenJohn = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(tokenJohn, uuid, [
      createDummyPreferenceHelperInterval(
        7,
        11,
        undefined,
        undefined,
        PreferenceType.PREFERRED,
      ),
      createDummyPreferenceHelperInterval(
        11,
        15,
        undefined,
        undefined,
        PreferenceType.NOTPREFERRED,
      ),
      createDummyPreferenceHelperInterval(
        15,
        20,
        undefined,
        undefined,
        PreferenceType.PREFERRED,
      ),
    ]);
    const res = await info(uuid);
    expect(new Set(res.body.user_availabilities.John)).toStrictEqual(
      new Set([
        createDummyPreferenceHelperInterval(
          7,
          11,
          undefined,
          undefined,
          PreferenceType.PREFERRED,
        ),
        createDummyPreferenceHelperInterval(
          11,
          15,
          undefined,
          undefined,
          PreferenceType.NOTPREFERRED,
        ),
        createDummyPreferenceHelperInterval(
          15,
          20,
          undefined,
          undefined,
          PreferenceType.PREFERRED,
        ),
      ]),
    );
    await removeAvailabilities(tokenJohn, uuid, [
      createDummyHelperInterval(13, 14),
    ]);
    expect(
      (await info(uuid)).body.user_availabilities.John.length,
    ).toStrictEqual(4);
  });

  test("Intersection with different preferences take lowest preference", async () => {
    const uuid = (await scheduleSelectedDates("Schedule", "UTC", [0])).body
      .uuid;

    const tokenJohn = (await login("John", uuid, "password")).body.token;
    await addAvailabilities(tokenJohn, uuid, [
      createDummyPreferenceHelperInterval(
        7,
        13,
        undefined,
        undefined,
        PreferenceType.PREFERRED,
      ),
      createDummyPreferenceHelperInterval(
        11,
        15,
        undefined,
        undefined,
        PreferenceType.NOTPREFERRED,
      ),
      createDummyPreferenceHelperInterval(
        14,
        20,
        undefined,
        undefined,
        PreferenceType.PREFERRED,
      ),
      createDummyPreferenceHelperInterval(
        16,
        17,
        undefined,
        undefined,
        PreferenceType.NOTPREFERRED,
      ),
    ]);
    const res = await info(uuid);
    expect(new Set(res.body.user_availabilities.John)).toStrictEqual(
      new Set([
        createDummyPreferenceHelperInterval(
          7,
          11,
          undefined,
          undefined,
          PreferenceType.PREFERRED,
        ),
        createDummyPreferenceHelperInterval(
          11,
          15,
          undefined,
          undefined,
          PreferenceType.NOTPREFERRED,
        ),
        createDummyPreferenceHelperInterval(
          15,
          16,
          undefined,
          undefined,
          PreferenceType.PREFERRED,
        ),
        createDummyPreferenceHelperInterval(
          16,
          17,
          undefined,
          undefined,
          PreferenceType.NOTPREFERRED,
        ),
        createDummyPreferenceHelperInterval(
          17,
          20,
          undefined,
          undefined,
          PreferenceType.PREFERRED,
        ),
      ]),
    );
  });
});
