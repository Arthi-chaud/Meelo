import { TestingModule } from "@nestjs/testing";
import ParserService from "./parser.service";
import { createTestingModule } from "test/test-module";

describe('Parser Service', () => {
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

	describe('Split Groups', () => {
		it("No Group", () => {
			const res = parserService.splitGroups(
				'Strict Machine'
			)
			expect(res).toStrictEqual(['Strict Machine']);
		});
		it("Simple Group", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna)'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna']);
		});
		it("Simple Dash Group", () => {
			const res = parserService.splitGroups(
				'A - B'
			)
			expect(res).toStrictEqual(['A', 'B']);
		});

		it("Two Groups", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna)  [Remix]'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix']);
		});
		it("Two Groups (Same Delimiters)", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna)  (Remix)'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix']);
		});
		it("Two Groups (No Whitespace)", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna)[Remix]'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix']);
		});
		it("Three Groups", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna) [Remix A ]  {Edit B}'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix A', 'Edit B']);
		});
		it("Three Groups (Different separator Order)", () => {
			const res = parserService.splitGroups(
				'Me Against the Music [feat. Madonna] [Remix A] (Edit B)'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix A', 'Edit B']);
		});
		it("Nested Groups", () => {
			const res = parserService.splitGroups(
				'Me Against the Music [feat. Madonna  [Remix A] (Edit B)]'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix A', 'Edit B']);
		});
		it("Nested Group + Simple Group", () => {
			const res = parserService.splitGroups(
				'Me Against the Music [feat. Madonna  [Remix A] (Edit B)] [Version C]'
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix A', 'Edit B', 'Version C']);
		});
		it("Dash Group", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna) - Remix A (Edit B)',
			)
			expect(res).toStrictEqual(['Me Against the Music', 'feat. Madonna', 'Remix A', 'Edit B']);
		});
		it("Group before root (Simple)", () => {
			const res = parserService.splitGroups('(A) B', { keepDelimiters: true })
			expect(res).toStrictEqual(['(A)', 'B']);
		});
		it("Group before root (hard)", () => {
			const res = parserService.splitGroups('(A) B - C [D]', { keepDelimiters: true })
			expect(res).toStrictEqual(['(A)', 'B', '- C', '[D]']);
		});
	})


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
		it('Multiple artists: A (feat. B) [feat. C]', () => {
			const res = parserService.extractFeaturedArtistsFromSongName(
				'4 Minutes (feat. Justin Timberlake) [feat. Timbaland]'
			)
			expect(res.name).toBe('4 Minutes');
			expect(res.featuring).toStrictEqual(['Justin Timberlake', 'Timbaland']);
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
		});
	});

	describe("Extract artists name from artist name", () => {
		it('No Featuring', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Madonna'
			)
			expect(res.artist).toBe('Madonna');
			expect(res.featuring).toStrictEqual([]);
		});
		it('No Featuring (Multiple words)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Everything but the Girl'
			)
			expect(res.artist).toBe('Everything but the Girl');
			expect(res.featuring).toStrictEqual([]);
		});
		it('2 Artists (&)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Iggy Azalea & Tyga'
			)
			expect(res.artist).toBe('Iggy Azalea');
			expect(res.featuring).toStrictEqual(['Tyga']);
		});
		it('2 Artists (feat.)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Clean Bandit feat. Jess Glynne'
			)
			expect(res.artist).toBe('Clean Bandit');
			expect(res.featuring).toStrictEqual(['Jess Glynne']);
		});
		it('2 Artists (Feat.)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Clean Bandit Feat. Jess Glynne'
			)
			expect(res.artist).toBe('Clean Bandit');
			expect(res.featuring).toStrictEqual(['Jess Glynne']);
		});
		it('2 Artists (Featuring)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Clean Bandit Featuring Jess Glynne'
			)
			expect(res.artist).toBe('Clean Bandit');
			expect(res.featuring).toStrictEqual(['Jess Glynne']);
		});
		it('2 Artists ((feat.))', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Clean Bandit (feat. Jess Glynne)'
			)
			expect(res.artist).toBe('Clean Bandit');
			expect(res.featuring).toStrictEqual(['Jess Glynne']);
		});
		it('Ambiguous', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Christine & The Queens'
			)
			expect(res.artist).toBe('Christine & The Queens');
			expect(res.featuring).toStrictEqual([]);
		});
		it('Custom', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Miss Kittin & The Hacker'
			)
			expect(res.artist).toBe('Miss Kittin & The Hacker');
			expect(res.featuring).toStrictEqual([]);
		});
		it('2 artists (Ambiguous)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Robin Schulz & Me & My Monkey'
			)
			expect(res.artist).toBe('Robin Schulz');
			expect(res.featuring).toStrictEqual(['Me & My Monkey']);
		});
		it('3 Artists', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Charli XCX, Caroline Polacheck & Christine'
			)
			expect(res.artist).toBe('Charli XCX');
			expect(res.featuring).toStrictEqual(['Caroline Polacheck', 'Christine']);
		});
		it('3 Artists (Featuring)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Clean Bandit Featuring Jess Glynne & BBBB'
			)
			expect(res.artist).toBe('Clean Bandit');
			expect(res.featuring).toStrictEqual(['Jess Glynne', 'BBBB']);
		});
		
		it('4 Artists (Featuring)', () => {
			const res = parserService.extractFeaturedArtistsFromArtistName(
				'Clean Bandit Featuring Jess Glynne, BBBB & CCCC'
			)
			expect(res.artist).toBe('Clean Bandit');
			expect(res.featuring).toStrictEqual(['Jess Glynne', 'BBBB', 'CCCC']);
		});
	});
});