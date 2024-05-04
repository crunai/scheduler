import request from "supertest";
import { app } from "../../src/app";
import { setupTests } from "../testHelper";

describe("Health testing", () => {
  setupTests();
  test("Ok", async () => {
    expect((await request(app).get("/")).status).toStrictEqual(200);
  });
});