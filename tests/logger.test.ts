import { describe, expect, it } from "bun:test";
import { Writable } from "node:stream";
import { buildLogger, resolveFormat } from "../src/logger";

/** A real Writable so pino-pretty (which pipes to its destination) is happy. */
const capture = () => {
	let buf = "";
	const stream = new Writable({
		write(chunk, _enc, cb) {
			buf += chunk.toString();
			cb();
		},
	});
	return { stream, read: () => buf.trim() };
};

// pino flushes to the sink on the next tick.
const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("buildLogger formats", () => {
	it("json emits one parseable JSON record", async () => {
		const sink = capture();
		buildLogger("json", "info", sink.stream).info({ path: "/v4" }, "request");
		await tick();

		const record = JSON.parse(sink.read());
		expect(record.msg).toBe("request");
		expect(record.path).toBe("/v4");
		expect(record.level).toBe(30);
	});

	it("plain emits human-readable, non-JSON output", async () => {
		const sink = capture();
		buildLogger("plain", "info", sink.stream).info({ path: "/v4" }, "request");
		await tick();

		const out = sink.read();
		expect(out).toContain("request");
		expect(out).toContain("/v4");
		expect(() => JSON.parse(out)).toThrow();
	});

	it("silent emits nothing", async () => {
		const sink = capture();
		buildLogger("json", "silent", sink.stream).info("ignored");
		await tick();
		expect(sink.read()).toBe("");
	});
});

describe("resolveFormat", () => {
	const withEnv = (value: string | undefined, fn: () => void) => {
		const prev = process.env.LOG_FORMAT;
		if (value === undefined) delete process.env.LOG_FORMAT;
		else process.env.LOG_FORMAT = value;
		try {
			fn();
		} finally {
			if (prev === undefined) delete process.env.LOG_FORMAT;
			else process.env.LOG_FORMAT = prev;
		}
	};

	it("defaults to json when unset", () => {
		withEnv(undefined, () => expect(resolveFormat()).toBe("json"));
	});

	it.each(["json", "plain"] as const)("accepts %s", (value) => {
		withEnv(value, () => expect(resolveFormat()).toBe(value));
	});

	it("throws on an unknown format", () => {
		withEnv("xml", () =>
			expect(() => resolveFormat()).toThrow(/Invalid LOG_FORMAT/),
		);
	});
});
