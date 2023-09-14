import { TestingModule } from "@nestjs/testing";
import ParserService from "./parser.service";
import { createTestingModule } from "test/test-module";
import { AlbumType, SongType } from "@prisma/client";

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

	describe('Strip Groups', () => {
		it("No Group", () => {
			const res = parserService.stripGroups(
				'Strict Machine'
			)
			expect(res).toStrictEqual('Strict Machine');
		});
		it("Simple Group", () => {
			const res = parserService.stripGroups(
				'Me Against the Music (feat. Madonna)'
			)
			expect(res).toStrictEqual('Me Against the Music');
		});
		it("Simple Dash Group", () => {
			const res = parserService.stripGroups(
				'A - B'
			)
			expect(res).toStrictEqual('A');
		});
		it("Group before root (hard)", () => {
			const res = parserService.stripGroups('(A) B - C [D]')
			expect(res).toStrictEqual('B');
		});
		it('Simple', () => {
			const res = parserService.stripGroups('A (B)')
			expect(res).toStrictEqual('A');
		})
		it('Group Before Root', () => {
			const res = parserService.stripGroups('(A) B')
			expect(res).toStrictEqual('B');
		})
		it("Three Groups (Different separator Order)", () => {
			const res = parserService.stripGroups(
				'Me Against the Music    [feat. Madonna]  [Remix A]   (Edit B)'
			)
			expect(res).toStrictEqual('Me Against the Music');
		});

	})

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
		it('Remove Root: Simple', () => {
			const res = parserService.splitGroups('A (B)', { removeRoot: true })
			expect(res).toStrictEqual(['B']);
		})
		it('Remove Root: Group Before Root', () => {
			const res = parserService.splitGroups('(A) B', { removeRoot: true })
			expect(res).toStrictEqual(['A']);
		})
		it("Remove Root: Two Groups", () => {
			const res = parserService.splitGroups(
				'Me Against the Music (feat. Madonna)[Remix]',
				{ removeRoot: true }
			)
			expect(res).toStrictEqual(['feat. Madonna', 'Remix']);
		});
		it("Remove Root: Nested Group + Simple Group", () => {
			const res = parserService.splitGroups(
				'Me Against the Music [feat. Madonna  [Remix A] (Edit B)] [Version C]',
				{ removeRoot: true }
			)
			expect(res).toStrictEqual(['feat. Madonna', 'Remix A', 'Edit B', 'Version C']);
		});
	});

	describe('Get Song Type', () => {
		it("Original Version (No group)", () => {
			expect(parserService.getSongType('My Song')).toBe(SongType.Original)
		});
		it("Original Version (Album Version)", () => {
			expect(parserService.getSongType('My Song (Album Version)')).toBe(SongType.Original)
		});
		it("Original Version (Main Version)", () => {
			expect(parserService.getSongType('My Song (Main Version)')).toBe(SongType.Original)
		});
		it("Original Version (Original Version)", () => {
			expect(parserService.getSongType('My Song (Original Version)')).toBe(SongType.Original)
		});
		it("Original Version (Feat Group)", () => {
			expect(parserService.getSongType('My Song (feat. A)')).toBe(SongType.Original)
		});
		it("Original Version (Tricky Name - Beats)", () => {
			expect(parserService.getSongType('Heart Beats')).toBe(SongType.Original)
		});
		it("Original Version (Tricky Name - Live)", () => {
			expect(parserService.getSongType('Live')).toBe(SongType.Original)
		});
		it("Original Version (Tricky Name - Clean)", () => {
			expect(parserService.getSongType('Clean')).toBe(SongType.Original)
		});
		it("Original Version (Tricky Name - Credits)", () => {
			expect(parserService.getSongType('Credits')).toBe(SongType.Original)
		});

		it("Acoustic Version", () => {
			expect(parserService.getSongType('Live It Up (Acoustic Version)')).toBe(SongType.Acoustic)
		});
		it("Acoustic Version", () => {
			expect(parserService.getSongType('Live It Up (Acoustic)')).toBe(SongType.Acoustic)
		});
		it("Acoustic Version (Acoustic Mix)", () => {
			expect(parserService.getSongType('Live It Up (Acoustic Mix)')).toBe(SongType.Acoustic)
		});
		it("Acoustic Version (Acoustic Remix)", () => {
			expect(parserService.getSongType('Live It Up (Acoustic Remix)')).toBe(SongType.Acoustic)
		});
	
		it("Instrumental Version (Simple Group)", () => {
			expect(parserService.getSongType('My Song (Instrumental)')).toBe(SongType.Instrumental)
		});
		it("Instrumental Version (Instrumental Version)", () => {
			expect(parserService.getSongType('My Song (Instrumental Version)')).toBe(SongType.Instrumental)
		});
		it("Instrumental Version (Version Instrumentale)", () => {
			expect(parserService.getSongType('My Song (Version Instrumentale)')).toBe(SongType.Instrumental)
		});
		it("Instrumental Version (Instrumental Mix)", () => {
			expect(parserService.getSongType('My Song (Instrumental Mix)')).toBe(SongType.Instrumental)
		});

		it("Remix (Extended 12'')", () => {
			expect(parserService.getSongType("Fever (Extended 12'')")).toBe(SongType.Remix)
		});
		it('Remix (Extended 12")', () => {
			expect(parserService.getSongType('Fever (Extended 12")')).toBe(SongType.Remix)
		});
		it("Remix (7'' Mix)", () => {
			expect(parserService.getSongType("Fever (7'' Mix)")).toBe(SongType.Remix)
		});
		it('Remix (7" Remix)', () => {
			expect(parserService.getSongType('Fever (7" Remix)')).toBe(SongType.Remix)
		});
		it("Remix (Olliver Helden Remix)", () => {
			expect(parserService.getSongType("Fever (Olliver Helden Remix)")).toBe(SongType.Remix)
		});
		it('Remix (Extended Mix)', () => {
			expect(parserService.getSongType('Fever (Extended Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Extended Remix)', () => {
			expect(parserService.getSongType('Fever (Extended Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Extended Remix Edit)', () => {
			expect(parserService.getSongType('Fever (Extended Mix Edit)')).toBe(SongType.Remix)
		});
		it('Remix (Ambiant Mix)', () => {
			expect(parserService.getSongType('Fever (Ambiant Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Remix)[Radio Edit]', () => {
			expect(parserService.getSongType('Fever (Remix)[Radio Edit]')).toBe(SongType.Remix)
		});
		it('Remix (Rock Mix)', () => {
			expect(parserService.getSongType('Fever (Rock Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Remix Edit)', () => {
			expect(parserService.getSongType('Fever (Remix Edit)')).toBe(SongType.Remix)
		});
		it('Remix (Mix Edit)', () => {
			expect(parserService.getSongType('Sing It Back (Can 7 Supermarket Mix Edit)')).toBe(SongType.Remix)
		});
		it('Remix (Vocal Edit)', () => {
			expect(parserService.getSongType('Sing It Back (Can 7 Supermarket Vocal Edit)')).toBe(SongType.Remix)
		});
		it('Remix (Radio Mix)', () => {
			expect(parserService.getSongType('Fever (Radio Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Instrumental Break Down Mix)', () => {
			expect(parserService.getSongType('Fever (Instrumental Break Down Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Electro Bashment Instrumental Remix)', () => {
			expect(parserService.getSongType('Fever (Electro Bashment Instrumental Remix)')).toBe(SongType.Remix)
		});

		it('Remix (Dub Mix)', () => {
			expect(parserService.getSongType('Fever (Dub Mix)')).toBe(SongType.Remix)
		});
		it('Remix (Dub)', () => {
			expect(parserService.getSongType('Fever (Dub)')).toBe(SongType.Remix)
		});
		it('Remix (Extended Dub)', () => {
			expect(parserService.getSongType('Fever (Extended Dub)')).toBe(SongType.Remix)
		});
		it('Remix (Dub Edit)', () => {
			expect(parserService.getSongType('Fever (Dub Edit)')).toBe(SongType.Remix)
		});

		it('Remix (Beats)', () => {
			expect(parserService.getSongType('Fever (Beats)')).toBe(SongType.Remix)
		});
		it('Remix (Jam Beats)', () => {
			expect(parserService.getSongType('Fever (Jam Beats)')).toBe(SongType.Remix)
		});

		it('Demo (Demo)', () => {
			expect(parserService.getSongType('Fever (Demo)')).toBe(SongType.Demo)
		});
		it('Demo (Demo 1)', () => {
			expect(parserService.getSongType('Fever (Demo 1)')).toBe(SongType.Demo)
		});
		it('Demo (First Demo)', () => {
			expect(parserService.getSongType('Fever (First Demo)')).toBe(SongType.Demo)
		});

		it('Demo (Rough Mix)', () => {
			expect(parserService.getSongType('Fever (Rough Mix)')).toBe(SongType.Original)
		});
		it('Demo (Rough Mix Edit)', () => {
			expect(parserService.getSongType('Fever (Rough Mix Edit)')).toBe(SongType.Original)
		});

		it("Live (Simple)", () => {
			expect(parserService.getSongType('Fever (Live)')).toBe(SongType.Live);
		});
		it("Live (Live from)", () => {
			expect(parserService.getSongType('Fever (Live from X)')).toBe(SongType.Live);
		})
		it("Live (Live at)", () => {
			expect(parserService.getSongType('Fever (Live at X)')).toBe(SongType.Live);
		})
		it("Live (Live in)", () => {
			expect(parserService.getSongType('Fever (Live in X)')).toBe(SongType.Live);
		})
		it("Live (Live Version)", () => {
			expect(parserService.getSongType('Fever (Live Version)')).toBe(SongType.Live);
		})
		it("Live (Version Live)", () => {
			expect(parserService.getSongType('Fever (Version Live)')).toBe(SongType.Live);
		})
		it("Live (Remixed)", () => {
			expect(parserService.getSongType('Fever (Remix) [Live]')).toBe(SongType.Live);
		});
		it("Live (Live Edit)", () => {
			expect(parserService.getSongType('Fever (Live Edit from X)')).toBe(SongType.Live);
		});


		it("Clean (Clean)", () => {
			expect(parserService.getSongType('Fever (Clean)')).toBe(SongType.Clean);
		});
		it("Clean (Clean Version)", () => {
			expect(parserService.getSongType('Fever (Clean Version)')).toBe(SongType.Clean);
		});
		it("Clean (Clean Edit)", () => {
			expect(parserService.getSongType('Fever (Clean Edit)')).toBe(SongType.Clean);
		});

		it("Edit (Edit)", () => {
			expect(parserService.getSongType('Fever (Edit)')).toBe(SongType.Edit);
		});
		it("Edit (Single Version)", () => {
			expect(parserService.getSongType('Fever (Single Version)')).toBe(SongType.Edit);
		});
		it("Edit (7''Edit)", () => {
			expect(parserService.getSongType("Fever (7'' Edit)")).toBe(SongType.Edit);
		});
		it('Edit (7" Edit)', () => {
			expect(parserService.getSongType('Fever (7" Edit)')).toBe(SongType.Edit);
		});
		it("Edit (Edit Version)", () => {
			expect(parserService.getSongType('Fever (Edit Version)')).toBe(SongType.Edit);
		});
		it("Edit (Album Edit)", () => {
			expect(parserService.getSongType('Fever (Album Edit)')).toBe(SongType.Edit);
		});

		it("Acapella (Acapella)", () => {
			expect(parserService.getSongType("Don't Give It Up (Acapella)")).toBe(SongType.Acapella);
		});
		it("Acapella (Remix Acapella)", () => {
			expect(parserService.getSongType("Don't Give It Up (Remix Acapella)")).toBe(SongType.Remix);
		});
	});


	describe('Detect Album Type', () => {

		it('should identify title as studio album', () => {
			expect(parserService.getAlbumType('Into the Skyline')).toBe(AlbumType.StudioRecording);
			expect(parserService.getAlbumType('Celebration')).toBe(AlbumType.StudioRecording);
			expect(parserService.getAlbumType('Living Room')).toBe(AlbumType.StudioRecording);
		});

		it('should identify title as live album', () => {
			expect(parserService.getAlbumType('Intimate & Live')).toBe(AlbumType.LiveRecording);
			expect(parserService.getAlbumType('Some Album (Live)')).toBe(AlbumType.LiveRecording);
			expect(parserService.getAlbumType('11,000 Click (Live at Brixton)')).toBe(AlbumType.LiveRecording);
			expect(parserService.getAlbumType('Unplugged')).toBe(AlbumType.LiveRecording);
			expect(parserService.getAlbumType('Live À Paris')).toBe(AlbumType.LiveRecording);
		});

		it('should identify title as compilation album', () => {
			expect(parserService.getAlbumType('Happy BusDay: Best of Superbus')).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType('The Very Best of Moby')).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType('The Singles Collection')).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType('The Immaculate Collection')).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType('Greatest Hits: My Prerogative')).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType('A decade of Hits')).toBe(AlbumType.Compilation);
		});

		it("should identify title as video album", () => {
			expect(parserService.getAlbumType('Britney: The Videos')).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType('Greatest Hits: My Prerogative - The Videos')).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType('Celebration - The Video Collection')).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType('The Video Collection 93:99')).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType('Music Videos')).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType('Music Videos II')).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType('In The Zone DVD')).toBe(AlbumType.VideoAlbum);
		});
		it("should identify title as remix album", () => {
			expect(parserService.getAlbumType('B In The Mix: The Remixes')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('Rated R: Remixed')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('Move To This - Remix Album')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('Essential Mixes - 12" Masters')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('Everybody Move (To The Mixes)')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('Dance Remixes')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('The Best Mixes From The Album Debut')).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType('Mixes')).toBe(AlbumType.RemixAlbum);
		});

		it("should identify title as soundtrack album", () => {
			expect(parserService.getAlbumType('Evita: The Complete Motion Picture Music Soundtrack')).toBe(AlbumType.Soundtrack);
			expect(parserService.getAlbumType("Who's That Girl (Original Motion Picture Soundtrack)")).toBe(AlbumType.Soundtrack);
			expect(parserService.getAlbumType("Berlin Calling (The Soundtrack)")).toBe(AlbumType.Soundtrack);
			expect(parserService.getAlbumType('Desperate Housewives (Music From and Inspired By The Television Series)')).toBe(AlbumType.Soundtrack);
			expect(parserService.getAlbumType("The Next Best Thing: Music From the Motion Picture")).toBe(AlbumType.Soundtrack);
			expect(parserService.getAlbumType("8 femmes (Bande originale du film)")).toBe(AlbumType.Soundtrack);
		});

		it('should identify title as single', () => {
			expect(parserService.getAlbumType('Twist - Single')).toBe(AlbumType.Single);
			expect(parserService.getAlbumType('Twist - EP')).toBe(AlbumType.Single);
			expect(parserService.getAlbumType('Falling (Remixes)')).toBe(AlbumType.Single);
		});
	});
});