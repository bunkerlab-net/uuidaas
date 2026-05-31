import { describe, expect, it } from "bun:test";
import { v4 } from "uuid";
import { app } from "../src/app";

const post = (path: string, payload: unknown) =>
  app.handle(
    new Request(`http://localhost/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

// A known-equivalent pair: the same 128 bits as a ULID and as a UUID.
const ULID = "01ARYZ6S4112ZSW8WTJBP55X2K";
const UUID = "01563df3-6481-08bf-9e23-9a92ec52f453";

describe("POST /ulid/to-uuid", () => {
  it("converts a ULID to its UUID form", async () => {
    const res = await post("/ulid/to-uuid", { ulid: ULID });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ulid: ULID, uuid: UUID });
  });

  it("returns 400 for an invalid ULID", async () => {
    const res = await post("/ulid/to-uuid", { ulid: "not-a-ulid" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid ULID");
  });

  it("rejects a body missing the ulid field with 422", async () => {
    const res = await post("/ulid/to-uuid", {});
    expect(res.status).toBe(422);
  });
});

describe("POST /uuid/to-ulid", () => {
  it("converts a UUID to its ULID form", async () => {
    const res = await post("/uuid/to-ulid", { uuid: UUID });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ uuid: UUID, ulid: ULID });
  });

  it("accepts a standard RFC UUID (e.g. v4)", async () => {
    const uuid = v4();
    const res = await post("/uuid/to-ulid", { uuid });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ulid: string };
    expect(body.ulid).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("returns 400 for an invalid UUID", async () => {
    const res = await post("/uuid/to-ulid", { uuid: "not-a-uuid" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid UUID");
  });

  it("rejects a body missing the uuid field with 422", async () => {
    const res = await post("/uuid/to-ulid", {});
    expect(res.status).toBe(422);
  });
});

describe("round-trip", () => {
  it("ulid -> uuid -> ulid returns the original ULID", async () => {
    const toUuid = (await (
      await post("/ulid/to-uuid", { ulid: ULID })
    ).json()) as {
      uuid: string;
    };
    const back = (await (
      await post("/uuid/to-ulid", { uuid: toUuid.uuid })
    ).json()) as { ulid: string };
    expect(back.ulid).toBe(ULID);
  });
});
