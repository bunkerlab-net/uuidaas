import { describe, expect, it } from "bun:test";
import { app } from "../src/app";

describe("app", () => {
	it("serves the OpenAPI docs at /docs", async () => {
		const res = await app.handle(new Request("http://localhost/docs"));
		expect(res.status).toBe(200);
	});

	it("round-trips: a generated v7 reports as version 7", async () => {
		const gen = await app.handle(new Request("http://localhost/api/v7"));
		const { uuid } = (await gen.json()) as { uuid: string };

		const res = await app.handle(
			new Request("http://localhost/api/version", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ uuid }),
			}),
		);
		const body = (await res.json()) as { version: number };
		expect(body.version).toBe(7);
	});
});
