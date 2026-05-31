import { describe, expect, it } from "bun:test";
import { MAX, NIL, v3, v5, validate, version } from "uuid";
import { app } from "../src/app";

const URL_NAMESPACE = v5.URL;
const DNS_NAMESPACE = v5.DNS;

const get = (path: string) =>
	app.handle(new Request(`http://localhost/api${path}`));

const getJson = async (path: string) => {
	const res = await get(path);
	return { status: res.status, body: (await res.json()) as { uuid: string } };
};

describe("generate", () => {
	it("GET /v0 returns the nil UUID", async () => {
		const { status, body } = await getJson("/v0");
		expect(status).toBe(200);
		expect(body.uuid).toBe(NIL);
	});

	it("GET /max returns the max UUID", async () => {
		const { body } = await getJson("/max");
		expect(body.uuid).toBe(MAX);
	});

	it.each([
		["/v1", 1],
		["/v4", 4],
		["/v6", 6],
		["/v7", 7],
	] as const)("GET %s returns a valid v%d UUID", async (path, expected) => {
		const { status, body } = await getJson(path);
		expect(status).toBe(200);
		expect(validate(body.uuid)).toBe(true);
		expect(version(body.uuid)).toBe(expected);
	});

	it("GET /v4 returns a different UUID each call", async () => {
		const a = await getJson("/v4");
		const b = await getJson("/v4");
		expect(a.body.uuid).not.toBe(b.body.uuid);
	});

	describe("name-based (v3/v5)", () => {
		it.each([
			["/v3", 3],
			["/v5", 5],
		] as const)("GET %s defaults to a valid v%d UUID with a random name", async (path, expectedVersion) => {
			const { status, body } = await getJson(path);
			expect(status).toBe(200);
			expect(validate(body.uuid)).toBe(true);
			expect(version(body.uuid)).toBe(expectedVersion);
		});

		it("GET /v3?name=... is deterministic and matches the uuid lib", async () => {
			const first = await getJson("/v3?name=hello");
			const second = await getJson("/v3?name=hello");
			expect(first.body.uuid).toBe(second.body.uuid);
			expect(first.body.uuid).toBe(v3("hello", URL_NAMESPACE));
		});

		it("GET /v5 honours an explicit namespace", async () => {
			const { body } = await getJson(
				`/v5?name=hello&namespace=${DNS_NAMESPACE}`,
			);
			expect(body.uuid).toBe(v5("hello", DNS_NAMESPACE));
		});

		it("GET /v3 with an invalid namespace returns 400", async () => {
			const res = await get("/v3?namespace=not-a-uuid");
			expect(res.status).toBe(400);
			const body = (await res.json()) as { error: string };
			expect(body.error).toContain("Invalid namespace UUID");
		});
	});

	describe("nanoid", () => {
		it("GET /nanoid returns a 21-char URL-friendly id by default", async () => {
			const res = await get("/nanoid");
			expect(res.status).toBe(200);
			const body = (await res.json()) as { id: string };
			expect(body.id).toMatch(/^[A-Za-z0-9_-]{21}$/);
		});

		it("GET /nanoid?size=8 honours the requested length", async () => {
			const body = (await (await get("/nanoid?size=8")).json()) as {
				id: string;
			};
			expect(body.id).toHaveLength(8);
		});

		it("GET /nanoid returns a different id each call", async () => {
			const a = (await (await get("/nanoid")).json()) as { id: string };
			const b = (await (await get("/nanoid")).json()) as { id: string };
			expect(a.id).not.toBe(b.id);
		});

		it.each([
			"/nanoid?size=0",
			"/nanoid?size=99999",
			"/nanoid?size=abc",
		])("GET %s rejects an invalid size with 422", async (path) => {
			const res = await get(path);
			expect(res.status).toBe(422);
		});
	});
});
