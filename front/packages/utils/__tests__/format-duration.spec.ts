import { describe, expect, it } from "vitest";
import formatDuration from "../src/format-duration";

describe("Format Duration", () => {
	it("Should format duration correctly", () => {
		const duration = 61;
		const formatted = formatDuration(duration);

		expect(formatted).toBe("1:01");
	});
});
