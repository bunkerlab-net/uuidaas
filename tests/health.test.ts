import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("health", () => {
  it.each([
    "/health/live",
    "/health/ready",
  ])("GET %s returns 200 ok", async (path) => {
    const res = await app.handle(new Request(`http://localhost${path}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
