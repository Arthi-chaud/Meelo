import type { ArgumentMetadata } from "@nestjs/common";
import { ParseArtistSlugPipe, ParseSlugPipe } from "./pipe";

describe('Slug Pipe', () => {
	const inputMetadata: ArgumentMetadata = { type: 'custom' };

	describe('Basic Slug Pipe', () => {
		const slugPipe = new ParseSlugPipe();
		it("should format the string into a slug", () => {
			const slugged = slugPipe.transform("Hello World", inputMetadata);
			expect(slugged.toString()).toBe("hello-world");
		});
	
		it("should not modify the string, as it is already a slug", () => {
			const slugged = slugPipe.transform("good-morning", inputMetadata);
			expect(slugged.toString()).toBe("good-morning");
		})

	})
	describe('Artist Slug Pipe', () => {
		const artistSlugPipe = new ParseArtistSlugPipe();
	
		it("should parse the artist slug", () => {
			const slugged = artistSlugPipe.transform("My Artist", inputMetadata);
			expect(slugged!.toString()).toBe("my-artist");
		});
	
		it("should parse the 'compilation' keyword", () => {
			const slugged = artistSlugPipe.transform("compilations", inputMetadata);
			expect(slugged).toBeUndefined();
		});
	});
});