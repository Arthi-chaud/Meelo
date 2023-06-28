import { TestingModule } from "@nestjs/testing";
import ParserService from "./parser.service";
import { createTestingModule } from "test/test-module";

describe('Metadata Service', () => {
	let parserService: ParserService

	let moduleRef: TestingModule;
	beforeAll(async () => {
		moduleRef = await createTestingModule({
			providers: [ParserService],
		}).compile();
		parserService = moduleRef.get<ParserService>(ParserService);
	});

	afterAll(() => {
		moduleRef.close();
	});

	it('should be defined', () => {
		expect(parserService).toBeDefined();
	});


	describe("Extract artist name from song name", () => {
		it('No Featuring', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Strict Machine'
			)
			expect(res.name).toBe('Strict Machine');
			expect(res.featuring).toStrictEqual([]);
		})
		it('Basic: A (feat. B)', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Me Against the Music (feat. Madonna)'
			)
			expect(res.name).toBe('Me Against the Music');
			expect(res.featuring).toStrictEqual(['Madonna']);
		});
		it('Basic without parenthesis: A feat. B', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Me Against the Music feat. Madonna'
			)
			expect(res.name).toBe('Me Against the Music');
			expect(res.featuring).toStrictEqual(['Madonna']);
		});
		it('Basic: A (featuring B)', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Me Against the Music (featuring Madonna)'
			)
			expect(res.name).toBe('Me Against the Music');
			expect(res.featuring).toStrictEqual(['Madonna']);
		});
		it('Basic: A (Featuring B)', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Me Against the Music (Featuring Madonna)'
			)
			expect(res.name).toBe('Me Against the Music');
			expect(res.featuring).toStrictEqual(['Madonna']);
		});
		it('Basic: A (With B)', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Me Against the Music (With Madonna)'
			)
			expect(res.name).toBe('Me Against the Music');
			expect(res.featuring).toStrictEqual(['Madonna']);
		});
		it('Basic With Suffix: A (Suffix) [feat. B]', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Medellín (Offer Nissim Madame X In The Sphinx Mix) [feat. Maluma]'
			)
			expect(res.name).toBe('Medellín (Offer Nissim Madame X In The Sphinx Mix)');
			expect(res.featuring).toStrictEqual(['Maluma']);
		});
		it('Basic With Suffix: A (feat. B) [Suffix]', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Medellín (feat. Maluma) [Offer Nissim Madame X In The Sphinx Mix]'
			)
			expect(res.name).toBe('Medellín (Offer Nissim Madame X In The Sphinx Mix)');
			expect(res.featuring).toStrictEqual(['Maluma']);
		});
		it('Multiple artists: A (feat. B & C)', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'4 Minutes (feat. Justin Timberlake & Timbaland)'
			)
			expect(res.name).toBe('4 Minutes');
			expect(res.featuring).toStrictEqual(['Justin Timberlake', 'Timbaland']);
		});
		it('Multiple artists with Suffix: A (feat. B & C) [Remix Name]', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'4 Minutes (Remix) [feat. Justin Timberlake & Timbaland]'
			)
			expect(res.name).toBe('4 Minutes (Remix)');
			expect(res.featuring).toStrictEqual(['Justin Timberlake', 'Timbaland']);
		})
		it('Multiple artists without parenthesis: A featuring B & C (Remix)', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'4 Minutes featuring Justin Timberlake & Timbaland (Remix)'
			)
			expect(res.name).toBe('4 Minutes (Remix)');
			expect(res.featuring).toStrictEqual(['Justin Timberlake', 'Timbaland']);
		});
		it('3 featured artists', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Champion (feat. Nas, Drake & Young Jeezy)'
			)
			expect(res.name).toBe('Champion');
			expect(res.featuring).toStrictEqual(['Nas', 'Drake', 'Young Jeezy']);
		});
		it('4 featured artists', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'Champion (feat. Nas, Drake, Young Jeezy & Someone)'
			)
			expect(res.name).toBe('Champion');
			expect(res.featuring).toStrictEqual(['Nas', 'Drake', 'Young Jeezy', 'Someone']);
		})
	})
});