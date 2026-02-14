import { getSortName } from "./sort-name";

describe("Sort Names", () => {
	it("should split 'the'", () =>
		expect(getSortName("The Audience")).toBe("Audience, The"));

	it("should split 'the' (case insensitive)", () =>
		expect(getSortName("the audience")).toBe("audience, the"));

	it("should split 'a'", () =>
		expect(getSortName("A Love Story")).toBe("Love Story, A"));

	it("should split 'an'", () =>
		expect(getSortName("An Original Story")).toBe("Original Story, An"));

	it("should split 'l''", () =>
		expect(getSortName("L'Absente")).toBe("Absente, L'"));

	it("should not split 'a' (with accent)", () =>
		expect(getSortName("À la chaine")).toBe("À la chaine"));

	it("should not split 'at'", () =>
		expect(getSortName("At the park")).toBe("At the park"));
});
