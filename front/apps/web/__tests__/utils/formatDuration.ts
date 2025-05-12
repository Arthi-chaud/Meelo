import formatDuration from "../../src/utils/formatDuration";

describe("Format Duration", () => {
	it("Should format duration correctly", () => {
		const duration = 61;
		const formatted = formatDuration(duration);

		expect(formatted).toBe("1:01");
	});
});
