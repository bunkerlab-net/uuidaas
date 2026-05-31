import { describe, expect, it } from "bun:test";
import { MAX, NIL } from "uuid";
import { app } from "../src/app";

const post = (path: string, payload: unknown) =>
  app.handle(
    new Request(`http://localhost/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("POST /validate", () => {
  it("validates and decodes a v1 UUID in full (timestamp, clock seq, MAC)", async () => {
    const res = await post("/validate", { uuid: DNS });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      uuid: DNS,
      valid: true,
      version: 1,
      variant: "RFC",
      fields: {
        bytes: "6ba7b8109dad11d180b400c04fd430c8",
        timeLow: 0x6ba7b810,
        timeMid: 0x9dad,
        timeHiAndVersion: 0x11d1,
        clockSeqHi: 0x80,
        clockSeqLow: 0xb4,
        node: "00c04fd430c8",
        timestamp: "1998-02-04T22:13:53.151Z",
        clockSequence: 180,
        macAddress: "00:c0:4f:d4:30:c8",
      },
    });
  });

  it("decodes a DCE Security (v2) UUID in full (domain, identifier)", async () => {
    const uuid = "000003e8-5cd0-21f1-8a01-8b3d0efb2f53";
    const res = await post("/validate", { uuid });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      uuid,
      valid: true,
      version: 2,
      variant: "RFC",
      fields: {
        bytes: "000003e85cd021f18a018b3d0efb2f53",
        timeLow: 1000,
        timeMid: 23760,
        timeHiAndVersion: 8689,
        clockSeqHi: 138,
        clockSeqLow: 1,
        node: "8b3d0efb2f53",
        domain: 1,
        identifier: 1000,
      },
    });
  });

  it("reports junk as invalid with a 400", async () => {
    const res = await post("/validate", { uuid: "definitely-not-a-uuid" });
    const body = (await res.json()) as { uuid: string; valid: boolean };
    expect(res.status).toBe(400);
    expect(body).toEqual({ uuid: "definitely-not-a-uuid", valid: false });
  });

  it("rejects a body missing the uuid field with 422", async () => {
    const res = await post("/validate", {});
    expect(res.status).toBe(422);
  });
});

describe("POST /version", () => {
  it.each([
    [NIL, 0],
    [DNS, 1],
    [MAX, 15],
  ] as const)("reports %s as version %d", async (uuid, expected) => {
    const res = await post("/version", { uuid });
    const body = (await res.json()) as { uuid: string; version: number };
    expect(res.status).toBe(200);
    expect(body).toEqual({ uuid, version: expected });
  });

  it("returns 400 for an invalid UUID", async () => {
    const res = await post("/version", { uuid: "bad" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid UUID");
  });
});
