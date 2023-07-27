import { TestingModule } from "@nestjs/testing";
import ParserService from "./parser.service";
import { createTestingModule } from "test/test-module";
import { SongType } from "@prisma/client";

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
	})
});