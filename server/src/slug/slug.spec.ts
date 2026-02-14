import Slug from "./slug";

describe("Slugs", () => {
	it("should throw on empty input", () => {
		expect(() => new Slug().toString()).toThrow(Error);
	});

	it("should throw on empty string", () => {
		expect(() => new Slug("").toString()).toThrow(Error);
	});

	it("should build a simple slug (1 arg)", () => {
		expect(new Slug("Foo").toString()).toBe("foo");
	});

	it('should build a slug w/ trailing "!"', () => {
		expect(new Slug("Foo!").toString()).toBe("foo");
	});

	it("should build a simple slug (2 arg)", () => {
		expect(new Slug("Foo", "Bar").toString()).toBe("foo-bar");
	});

	it("should manage special characters", () => {
		expect(new Slug("ça va").toString()).toBe("ca-va");
	});

	it("should manage leading special characters", () => {
		expect(new Slug("?ça va").toString()).toBe("ca-va");
	});

	it("should manage trailing special characters", () => {
		expect(new Slug("ça va?").toString()).toBe("ca-va");
	});

	it("should manage strings with only special characters", () => {
		expect(new Slug("!!!").toString()).toBeDefined();
	});

	it("should transform hypen-similar chars to hyphens", () => {
		expect(new Slug("Sophie Ellis‐Bextor").toString()).toBe(
			"sophie-ellis-bextor",
		);
	});

	it("should manage a realist album name", () => {
		expect(
			new Slug(
				"The Dark Sidé of the Moon (Very Special Edition 20th anniversary)",
			).toString(),
		).toBe(
			"the-dark-side-of-the-moon-very-special-edition-20th-anniversary",
		);
	});

	it("should add prefix as the string is digits only", () => {
		expect(new Slug("123").toString()).toBe("123!");
	});

	it("should keep prefix as the string is digits only", () => {
		expect(new Slug("123!").toString()).toBe("123!");
	});

	it("should detect if string is a slug", () => {
		expect(Slug.isSlug("hello-world")).toBe(true);
	});

	it("should detect if string is not a slug", () => {
		expect(Slug.isSlug("hello world")).toBe(false);
	});

	it("should check prefix as the string is digits only", () => {
		expect(Slug.isSlug("123!")).toBe(true);
	});

	it("should have prefix as the string is digits only", () => {
		expect(Slug.isSlug("123")).toBe(false);
	});
	it("should consider ellipsis as space", () => {
		const actual = new Slug("Oops!...I Did it again").toString();
		const expected = new Slug("Oops!... I Did it again").toString();
		expect(actual).toBe(expected);
	});

	it("should consider unicode ellipsis as space", () => {
		const actual = new Slug("Oops!…I Did it again").toString();
		const expected = new Slug("Oops!... I Did it again").toString();
		expect(actual).toBe(expected);
	});
});
