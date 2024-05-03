import { setupTests } from "../testHelper";
import { login, scheduleDaysInWeek } from "../routeWrapper";

describe("Login route", () => {
  setupTests();

  test("New login", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", "Asia/Colombo", [2])).body
      .uuid;
    const res = await login("john", uuid, "password");
    expect(res.status).toStrictEqual(200);
    expect(res.body.token).toStrictEqual(expect.any(String));
  });

  test("Login with an existing token", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", "Asia/Colombo", [2])).body
      .uuid;
    await login("john", uuid, "password");
    const res = await login("john", uuid, "password");
    expect(res.status).toStrictEqual(200);
    expect(res.body.token).toStrictEqual(expect.any(String));

    const wrong = await login("john", uuid, "wrong");
    expect(wrong.status).toStrictEqual(400);
  });

  test("Invalid name", async () => {
    const uuid = (await scheduleDaysInWeek("weekend", "Asia/Colombo", [2])).body
      .uuid;
    const res = await login("j0$hn", uuid, "password");
    expect(res.status).toStrictEqual(400);
  });

  test("uuid is invalid", async () => {
    const res = await login("john", "uuid", "password");
    expect(res.status).toStrictEqual(400);
  });
});
