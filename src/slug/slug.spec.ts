import Slug from './slug';

describe('Settings Service', () => {

	it('should throw on empty input', () => {
		expect(() => new Slug().toString()).toThrow(Error);
	});

	it('should throw on empty string', () => {
		expect(() => new Slug('').toString()).toThrow(Error);
	});

	it('should build a simple slug (1 arg)', () => {
		expect(new Slug('Foo').toString()).toBe('foo');
	});

	it('should build a simple slug (2 arg)', () => {
		expect(new Slug('Foo', 'Bar').toString()).toBe('foo-bar');
	});

	it('should manage special characters', () => {
		expect(new Slug('ça va').toString()).toBe('ca-va');
	});

	it('should manage leading special characters', () => {
		expect(new Slug('?ça va').toString()).toBe('ca-va');
	});

	it('should manage trailing special characters', () => {
		expect(new Slug('ça va?').toString()).toBe('ca-va');
	});

	it('should manage a realist album name', () => {
		expect(
			new Slug('The Dark Sidé of the Moon (Very Special Edition 20th anniversary)').toString()
		).toBe('the-dark-side-of-the-moon-very-special-edition-20th-anniversary');
	});

	it('should detect if string is a slug', () => {
		expect(Slug.isSlug('hello-world')).toBe(true);
	});

	it('should detect if string is not a slug', () => {
		expect(Slug.isSlug('hello world')).toBe(false);
	});
})