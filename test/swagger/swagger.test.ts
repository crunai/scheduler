import request from "supertest";
import { app } from "../../src/app";
import { setupTests } from "../testHelper";

describe("Swagger serve testing", () => {
  setupTests();
  test("Check file is served", async () => {
    expect((await request(app).get("/api-docs")).notFound).toStrictEqual(false);
  });
});
