import { setupTests } from "../testHelper";
import { clear } from "../routeWrapper";

describe("Clear route", () => {
  setupTests();

  test("Valid clear", async () => {
    const res = await clear(process.env.CLEAR_PERM as string);
    expect(res.status).toStrictEqual(200);
  });

  test("Wrong format", async () => {
    const res = await clear("");
    expect(res.status).toStrictEqual(401);
  });

  test("Unauthorised", async () => {
    const res = await clear("test");
    expect(res.status).toStrictEqual(403);
  });
});
