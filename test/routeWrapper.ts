import request from "supertest";
import { app } from "../src/app";
import { PreferenceType } from "../src/database";

export const scheduleDaysInWeek = (
  name: string,
  timezone: string,
  days: number[],
  earliestHour?: number,
  latestHour?: number,
) => {
  return request(app)
    .post("/schedules/create/days-in-week")
    .send({ name, timezone, days, earliestHour, latestHour })
    .ok(() => true);
};

export const scheduleSelectedDates = (
  name: string,
  timezone: string,
  dates: number[],
  earliestHour?: number,
  latestHour?: number,
) => {
  return request(app)
    .post("/schedules/create/selected-dates")
    .send({ name, timezone, dates, earliestHour, latestHour })
    .ok(() => true);
};

export const getCommonAvailabilities = (
  scheduleUUID: string,
  sortByBest?: boolean,
) => {
  return request(app)
    .get("/schedules/common-availabilities")
    .query({ scheduleUUID, sortByBest })
    .ok(() => true);
};

export const info = (scheduleUUID: string) => {
  return request(app)
    .get("/schedules/info")
    .query({ scheduleUUID })
    .ok(() => true);
};

export const login = (name: string, scheduleUUID: string, password: string) => {
  return request(app)
    .post("/users/login")
    .send({ name, scheduleUUID, password })
    .ok(() => true);
};

export const addAvailabilities = (
  auth: string,
  scheduleUUID: string,
  availabilities: { start: number; end: number; preference: PreferenceType }[],
) => {
  return request(app)
    .put("/users/add-availabilities")
    .send({ scheduleUUID, availabilities })
    .set("Authorization", `Bearer ${auth}`)
    .ok(() => true);
};

export const removeAvailabilities = (
  auth: string,
  scheduleUUID: string,
  availabilities: { start: number; end: number }[],
) => {
  return request(app)
    .post("/users/remove-availabilities")
    .send({ scheduleUUID, availabilities })
    .set("Authorization", `Bearer ${auth}`)
    .ok(() => true);
};

export const clear = (auth: string) => {
  return request(app)
    .delete("/admin/clear")
    .set("Authorization", `Bearer ${auth}`)
    .ok(() => true);
};
