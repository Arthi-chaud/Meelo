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
	})
});