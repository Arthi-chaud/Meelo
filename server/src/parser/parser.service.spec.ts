import { TestingModule } from "@nestjs/testing";
import ParserService from "./parser.service";
import { createTestingModule } from "test/test-module";
import { AlbumType, SongType } from "@prisma/client";
import ArtistModule from "src/artist/artist.module";
import AlbumModule from "src/album/album.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import ParserModule from "./parser.module";
import PrismaService from "src/prisma/prisma.service";

describe("Parser Service", () => {
	let parserService: ParserService;

	let moduleRef: TestingModule;
	beforeAll(async () => {
		moduleRef = await createTestingModule({
			imports: [
				FileManagerModule,
				PrismaModule,
				ArtistModule,
				AlbumModule,
				ReleaseModule,
				ParserModule,
				SongModule,
				TrackModule,
				IllustrationModule,
				GenreModule,
				SettingsModule,
			],
		}).compile();
		const prismaService = moduleRef.get(PrismaService);
		await prismaService.artist
			.create({
				data: {
					name: "Christine & The Queens",
					slug: "christine-the-queens",
				},
			})
			.catch(() => {});
		await prismaService.artist
			.create({ data: { name: "Me & My Monkey", slug: "me-my-monkey" } })
			.catch(() => {});
		await prismaService.artist
			.create({
				data: {
					name: "Miss Kittin & The Hacker",
					slug: "miss-kittin-the-hacker",
				},
			})
			.catch(() => {});
		parserService = moduleRef.get<ParserService>(ParserService);
	});

	afterAll(async () => {
		await moduleRef.close();
	});

	it("should be defined", () => {
		expect(parserService).toBeDefined();
	});

	describe("Strip Groups", () => {
		it("No Group", () => {
			const res = parserService.stripGroups("Strict Machine");
			expect(res).toStrictEqual("Strict Machine");
		});
		it("Simple Group", () => {
			const res = parserService.stripGroups(
				"Me Against the Music (feat. Madonna)",
			);
			expect(res).toStrictEqual("Me Against the Music");
		});
		it("Simple Dash Group", () => {
			const res = parserService.stripGroups("A - B");
			expect(res).toStrictEqual("A");
		});
		it("Group before root (hard)", () => {
			const res = parserService.stripGroups("(A) B - C [D]");
			expect(res).toStrictEqual("B");
		});
		it("Simple", () => {
			const res = parserService.stripGroups("A (B)");
			expect(res).toStrictEqual("A");
		});
		it("Group Before Root", () => {
			const res = parserService.stripGroups("(A) B");
			expect(res).toStrictEqual("B");
		});
		it("Three Groups (Different separator Order)", () => {
			const res = parserService.stripGroups(
				"Me Against the Music    [feat. Madonna]  [Remix A]   (Edit B)",
			);
			expect(res).toStrictEqual("Me Against the Music");
		});
	});

	describe("Split Groups", () => {
		it("No Group", () => {
			const res = parserService.splitGroups("Strict Machine");
			expect(res).toStrictEqual(["Strict Machine"]);
		});
		it("Simple Group", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna)",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
			]);
		});
		it("Simple Dash Group", () => {
			const res = parserService.splitGroups("A - B");
			expect(res).toStrictEqual(["A", "B"]);
		});

		it("Two Groups", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna)  [Remix]",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix",
			]);
		});
		it("Two Groups (Same Delimiters)", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna)  (Remix)",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix",
			]);
		});
		it("Two Groups (No Whitespace)", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna)[Remix]",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix",
			]);
		});
		it("Three Groups", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna) [Remix A ]  {Edit B}",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix A",
				"Edit B",
			]);
		});
		it("Three Groups (Different separator Order)", () => {
			const res = parserService.splitGroups(
				"Me Against the Music [feat. Madonna] [Remix A] (Edit B)",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix A",
				"Edit B",
			]);
		});
		it("Nested Groups", () => {
			const res = parserService.splitGroups(
				"Me Against the Music [feat. Madonna  [Remix A] (Edit B)]",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix A",
				"Edit B",
			]);
		});
		it("Nested Group + Simple Group", () => {
			const res = parserService.splitGroups(
				"Me Against the Music [feat. Madonna  [Remix A] (Edit B)] [Version C]",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix A",
				"Edit B",
				"Version C",
			]);
		});
		it("Dash Group", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna) - Remix A (Edit B)",
			);
			expect(res).toStrictEqual([
				"Me Against the Music",
				"feat. Madonna",
				"Remix A",
				"Edit B",
			]);
		});
		it("Group before root (Simple)", () => {
			const res = parserService.splitGroups("(A) B", {
				keepDelimiters: true,
			});
			expect(res).toStrictEqual(["(A)", "B"]);
		});
		it("Group before root (hard)", () => {
			const res = parserService.splitGroups("(A) B - C [D]", {
				keepDelimiters: true,
			});
			expect(res).toStrictEqual(["(A)", "B", "- C", "[D]"]);
		});

		it("Remove Root: Simple", () => {
			const res = parserService.splitGroups("A (B)", {
				removeRoot: true,
			});
			expect(res).toStrictEqual(["B"]);
		});
		it("Remove Root: Group Before Root", () => {
			const res = parserService.splitGroups("(A) B", {
				removeRoot: true,
			});
			expect(res).toStrictEqual(["A"]);
		});
		it("Remove Root: Two Groups", () => {
			const res = parserService.splitGroups(
				"Me Against the Music (feat. Madonna)[Remix]",
				{ removeRoot: true },
			);
			expect(res).toStrictEqual(["feat. Madonna", "Remix"]);
		});
		it("Remove Root: Nested Group + Simple Group", () => {
			const res = parserService.splitGroups(
				"Me Against the Music [feat. Madonna  [Remix A] (Edit B)] [Version C]",
				{ removeRoot: true },
			);
			expect(res).toStrictEqual([
				"feat. Madonna",
				"Remix A",
				"Edit B",
				"Version C",
			]);
		});
		it("Dashed group in parenthesis (keeping root)", () => {
			const res = parserService.splitGroups(
				"Crooked Madam (Damn Mad - Shellfish Remix)",
				{ removeRoot: false, keepDelimiters: true },
			);
			expect(res).toStrictEqual([
				"Crooked Madam",
				"(Damn Mad - Shellfish Remix)",
			]);
		});
		it("Dashed group in parenthesis (removing root)", () => {
			const res = parserService.splitGroups(
				"Crooked Madam (Damn Mad - Shellfish Remix)",
				{ removeRoot: true },
			);
			expect(res).toStrictEqual(["Damn Mad - Shellfish Remix"]);
		});
		it("Dashed group in parenthesis (keeping delimiters)", () => {
			const res = parserService.splitGroups(
				"Crooked Madam (Damn Mad - Shellfish Remix)",
				{ keepDelimiters: true },
			);
			expect(res).toStrictEqual([
				"Crooked Madam",
				"(Damn Mad - Shellfish Remix)",
			]);
		});
	});

	describe("Extract artist name from song name", () => {
		it("No Featuring", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Strict Machine",
			);
			expect(res.name).toBe("Strict Machine");
			expect(res.featuring).toStrictEqual([]);
		});
		it("Basic: A (feat. B)", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Me Against the Music (feat. Madonna)",
			);
			expect(res.name).toBe("Me Against the Music");
			expect(res.featuring).toStrictEqual(["Madonna"]);
		});
		it("Basic without parenthesis: A feat. B", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Me Against the Music feat. Madonna",
			);
			expect(res.name).toBe("Me Against the Music");
			expect(res.featuring).toStrictEqual(["Madonna"]);
		});
		it("Tricky", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Good Times With Bad People",
			);
			expect(res.name).toBe("Good Times With Bad People");
			expect(res.featuring).toStrictEqual([]);
		});
		it("Basic: A (featuring B)", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Me Against the Music (featuring Madonna)",
			);
			expect(res.name).toBe("Me Against the Music");
			expect(res.featuring).toStrictEqual(["Madonna"]);
		});
		it("Basic: A (Featuring B)", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Me Against the Music (Featuring Madonna)",
			);
			expect(res.name).toBe("Me Against the Music");
			expect(res.featuring).toStrictEqual(["Madonna"]);
		});
		it("Basic: A (With B)", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Me Against the Music (With Madonna)",
			);
			expect(res.name).toBe("Me Against the Music");
			expect(res.featuring).toStrictEqual(["Madonna"]);
		});
		it("Basic With Suffix: A (Suffix) [feat. B]", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Medellín (Offer Nissim Madame X In The Sphinx Mix) [feat. Maluma]",
			);
			expect(res.name).toBe(
				"Medellín (Offer Nissim Madame X In The Sphinx Mix)",
			);
			expect(res.featuring).toStrictEqual(["Maluma"]);
		});
		it("Basic With Suffix: A (feat. B) [Suffix]", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Medellín (feat. Maluma) [Offer Nissim Madame X In The Sphinx Mix]",
			);
			expect(res.name).toBe(
				"Medellín (Offer Nissim Madame X In The Sphinx Mix)",
			);
			expect(res.featuring).toStrictEqual(["Maluma"]);
		});
		it("Multiple artists: A (feat. B) [feat. C]", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"4 Minutes (feat. Justin Timberlake) [feat. Timbaland]",
			);
			expect(res.name).toBe("4 Minutes");
			expect(res.featuring).toStrictEqual([
				"Justin Timberlake",
				"Timbaland",
			]);
		});
		it("Multiple artists: A (feat. B & C)", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"4 Minutes (feat. Justin Timberlake & Timbaland)",
			);
			expect(res.name).toBe("4 Minutes");
			expect(res.featuring).toStrictEqual([
				"Justin Timberlake",
				"Timbaland",
			]);
		});
		it("Multiple artists with Suffix: A (feat. B & C) [Remix Name]", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"4 Minutes (Remix) [feat. Justin Timberlake & Timbaland]",
			);
			expect(res.name).toBe("4 Minutes (Remix)");
			expect(res.featuring).toStrictEqual([
				"Justin Timberlake",
				"Timbaland",
			]);
		});
		it("Multiple artists without parenthesis: A featuring B & C (Remix)", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"4 Minutes featuring Justin Timberlake & Timbaland (Remix)",
			);
			expect(res.name).toBe("4 Minutes (Remix)");
			expect(res.featuring).toStrictEqual([
				"Justin Timberlake",
				"Timbaland",
			]);
		});
		it("3 featured artists", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Champion (feat. Nas, Drake & Young Jeezy)",
			);
			expect(res.name).toBe("Champion");
			expect(res.featuring).toStrictEqual([
				"Nas",
				"Drake",
				"Young Jeezy",
			]);
		});
		it("4 featured artists", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Champion (feat. Nas, Drake, Young Jeezy & Someone)",
			);
			expect(res.name).toBe("Champion");
			expect(res.featuring).toStrictEqual([
				"Nas",
				"Drake",
				"Young Jeezy",
				"Someone",
			]);
		});
		it('Using "with"', async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Champion (With A)",
			);
			expect(res.name).toBe("Champion");
			expect(res.featuring).toStrictEqual(["A"]);
		});
		it("Not a feature", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"You Lied To Me (Sprayed With Shep's Attitude)",
			);
			expect(res.name).toBe(
				"You Lied To Me (Sprayed With Shep's Attitude)",
			);
			expect(res.featuring).toStrictEqual([]);
		});
		it("Remix and features in same group", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"You Lied To Me (Remix Feat. Shep Pettibone)",
			);
			expect(res.name).toBe("You Lied To Me (Remix)");
			expect(res.featuring).toStrictEqual(["Shep Pettibone"]);
		});
		it("Handling nested groups", async () => {
			const res = await parserService.extractFeaturedArtistsFromSongName(
				"Crooked Madam (Damn Mad - Shellfish Remix)",
			);
			expect(res.name).toBe("Crooked Madam (Damn Mad - Shellfish Remix)");
			expect(res.featuring).toStrictEqual([]);
		});
	});

	describe("Extract artists name from artist name", () => {
		it("No Featuring", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Madonna",
				);
			expect(res.artist).toBe("Madonna");
			expect(res.featuring).toStrictEqual([]);
		});
		it("No Featuring (Multiple words)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Everything but the Girl",
				);
			expect(res.artist).toBe("Everything but the Girl");
			expect(res.featuring).toStrictEqual([]);
		});
		it("2 Artists (&)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Iggy Azalea & Tyga",
				);
			expect(res.artist).toBe("Iggy Azalea");
			expect(res.featuring).toStrictEqual(["Tyga"]);
		});
		it("2 Artists (feat.)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Clean Bandit feat. Jess Glynne",
				);
			expect(res.artist).toBe("Clean Bandit");
			expect(res.featuring).toStrictEqual(["Jess Glynne"]);
		});
		it("2 Artists (Feat.)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Clean Bandit Feat. Jess Glynne",
				);
			expect(res.artist).toBe("Clean Bandit");
			expect(res.featuring).toStrictEqual(["Jess Glynne"]);
		});
		it("2 Artists (Featuring)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Clean Bandit Featuring Jess Glynne",
				);
			expect(res.artist).toBe("Clean Bandit");
			expect(res.featuring).toStrictEqual(["Jess Glynne"]);
		});
		it("2 Artists ((feat.))", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Clean Bandit (feat. Jess Glynne)",
				);
			expect(res.artist).toBe("Clean Bandit");
			expect(res.featuring).toStrictEqual(["Jess Glynne"]);
		});

		it("Ambiguous", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Christine & The Queens",
				);
			expect(res.artist).toBe("Christine & The Queens");
			expect(res.featuring).toStrictEqual([]);
		});
		it("Custom", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Miss Kittin & The Hacker",
				);
			expect(res.artist).toBe("Miss Kittin & The Hacker");
			expect(res.featuring).toStrictEqual([]);
		});
		it("2 artists (Ambiguous)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Robin Schulz & Me & My Monkey",
				);
			expect(res.artist).toBe("Robin Schulz");
			expect(res.featuring).toStrictEqual(["Me & My Monkey"]);
		});
		it("3 Artists", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Charli XCX, Caroline Polacheck & Christine",
				);
			expect(res.artist).toBe("Charli XCX");
			expect(res.featuring).toStrictEqual([
				"Caroline Polacheck",
				"Christine",
			]);
		});
		it("3 Artists (Featuring)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Clean Bandit Featuring Jess Glynne & BBBB",
				);
			expect(res.artist).toBe("Clean Bandit");
			expect(res.featuring).toStrictEqual(["Jess Glynne", "BBBB"]);
		});

		it("4 Artists (Featuring)", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Clean Bandit Featuring Jess Glynne, BBBB & CCCC",
				);
			expect(res.artist).toBe("Clean Bandit");
			expect(res.featuring).toStrictEqual([
				"Jess Glynne",
				"BBBB",
				"CCCC",
			]);
		});
		it("'Vs.' Separator", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Snoop Dogg Vs. David Guetta",
				);
			expect(res.artist).toBe("Snoop Dogg");
			expect(res.featuring).toStrictEqual(["David Guetta"]);
		});
		it("'Vs' Separator", async () => {
			const res =
				await parserService.extractFeaturedArtistsFromArtistName(
					"Snoop Dogg Vs David Guetta",
				);
			expect(res.artist).toBe("Snoop Dogg");
			expect(res.featuring).toStrictEqual(["David Guetta"]);
		});
	});

	describe("Get Song Type", () => {
		it("Original Version (No group)", () => {
			expect(parserService.getSongType("My Song")).toBe(
				SongType.Original,
			);
		});
		it("Original Version (Album Version)", () => {
			expect(parserService.getSongType("My Song (Album Version)")).toBe(
				SongType.Original,
			);
		});
		it("Original Version (Main Version)", () => {
			expect(parserService.getSongType("My Song (Main Version)")).toBe(
				SongType.Original,
			);
		});
		it("Original Version (Original Version)", () => {
			expect(
				parserService.getSongType("My Song (Original Version)"),
			).toBe(SongType.Original);
		});
		it("Original Version (Original Mix)", () => {
			expect(parserService.getSongType("My Song (Original Mix)")).toBe(
				SongType.Original,
			);
		});
		it("Original Version (Feat Group)", () => {
			expect(parserService.getSongType("My Song (feat. A)")).toBe(
				SongType.Original,
			);
		});
		it("Original Version (Tricky Name - Beats)", () => {
			expect(parserService.getSongType("Heart Beats")).toBe(
				SongType.Original,
			);
		});
		it("Original Version (Tricky Name - Live)", () => {
			expect(parserService.getSongType("Live")).toBe(SongType.Original);
		});
		it("Original Version (Tricky Name - Clean)", () => {
			expect(parserService.getSongType("Clean")).toBe(SongType.Original);
		});
		it("Original Version (Tricky Name - Credits)", () => {
			expect(parserService.getSongType("Credits")).toBe(
				SongType.Original,
			);
		});

		it("Acoustic Version", () => {
			expect(
				parserService.getSongType("Live It Up (Acoustic Version)"),
			).toBe(SongType.Acoustic);
		});
		it("Acoustic Version", () => {
			expect(parserService.getSongType("Live It Up (Acoustic)")).toBe(
				SongType.Acoustic,
			);
		});
		it("Acoustic Version (Acoustic Mix)", () => {
			expect(parserService.getSongType("Live It Up (Acoustic Mix)")).toBe(
				SongType.Acoustic,
			);
		});
		it("Acoustic Version (Acoustic Remix)", () => {
			expect(
				parserService.getSongType("Live It Up (Acoustic Remix)"),
			).toBe(SongType.Acoustic);
		});

		it("Instrumental Version (Simple Group)", () => {
			expect(parserService.getSongType("My Song (Instrumental)")).toBe(
				SongType.Instrumental,
			);
		});
		it("Instrumental Version (Instrumental Version)", () => {
			expect(
				parserService.getSongType("My Song (Instrumental Version)"),
			).toBe(SongType.Instrumental);
		});
		it("Instrumental Version (Version Instrumentale)", () => {
			expect(
				parserService.getSongType("My Song (Version Instrumentale)"),
			).toBe(SongType.Instrumental);
		});
		it("Instrumental Version (Instrumental Mix)", () => {
			expect(
				parserService.getSongType("My Song (Instrumental Mix)"),
			).toBe(SongType.Instrumental);
		});
		it("Instrumental Version (Deepstrumental)", () => {
			expect(
				parserService.getSongType(
					"Deeper And Deeper (Shep's Deepstrumental)",
				),
			).toBe(SongType.Instrumental);
		});

		it("Remix (Extended 12'')", () => {
			expect(parserService.getSongType("Fever (Extended 12'')")).toBe(
				SongType.Remix,
			);
		});
		it('Remix (Extended 12")', () => {
			expect(parserService.getSongType('Fever (Extended 12")')).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Extended Album Version)", () => {
			expect(
				parserService.getSongType("Jump (Extended Album Vetsion)"),
			).toBe(SongType.Remix);
		});
		it('Remix (12")', () => {
			expect(
				parserService.getSongType(
					"Deeper And Deeper (Shep's Classic 12'')",
				),
			).toBe(SongType.Remix);
			expect(
				parserService.getSongType(
					"Deeper And Deeper (Shep's Classic 12\")",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (That Version)", () => {
			expect(
				parserService.getSongType("Freak Like Me (BRITS 2003 Version)"),
			).toBe(SongType.Remix);
			expect(
				parserService.getSongType(
					"Too Lost In You (Love Actually Version)",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (-Mix)", () => {
			expect(parserService.getSongType("Sorry (PSB Maxi-Mix)")).toBe(
				SongType.Remix,
			);
			expect(
				parserService.getSongType("Optimistique-Moi (Opti-Mix-tic)"),
			).toBe(SongType.Remix);
		});
		it("Remix (7'' Mix)", () => {
			expect(parserService.getSongType("Fever (7'' Mix)")).toBe(
				SongType.Remix,
			);
		});
		it('Remix (7" Remix)', () => {
			expect(parserService.getSongType('Fever (7" Remix)')).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Olliver Helden Remix)", () => {
			expect(
				parserService.getSongType("Fever (Olliver Helden Remix)"),
			).toBe(SongType.Remix);
		});
		it("Remix (Extended Mix)", () => {
			expect(parserService.getSongType("Fever (Extended Mix)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Extended Remix)", () => {
			expect(parserService.getSongType("Fever (Extended Mix)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Extended Remix Edit)", () => {
			expect(parserService.getSongType("Fever (Extended Mix Edit)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Ambiant Mix)", () => {
			expect(parserService.getSongType("Fever (Ambiant Mix)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Remix)[Radio Edit]", () => {
			expect(parserService.getSongType("Fever (Remix)[Radio Edit]")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Rock Mix)", () => {
			expect(parserService.getSongType("Fever (Rock Mix)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Remix Edit)", () => {
			expect(parserService.getSongType("Fever (Remix Edit)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Mix Edit)", () => {
			expect(
				parserService.getSongType(
					"Sing It Back (Can 7 Supermarket Mix Edit)",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (Vocal Edit)", () => {
			expect(
				parserService.getSongType(
					"Sing It Back (Can 7 Supermarket Vocal Edit)",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (Radio Mix)", () => {
			expect(parserService.getSongType("Fever (Radio Mix)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Instrumental Break Down Mix)", () => {
			expect(
				parserService.getSongType(
					"Fever (Instrumental Break Down Mix)",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (Electro Bashment Instrumental Remix)", () => {
			expect(
				parserService.getSongType(
					"Fever (Electro Bashment Instrumental Remix)",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (Re-Edit)", () => {
			expect(
				parserService.getSongType("Ooh La La (Phones Re-Edit)"),
			).toBe(SongType.Remix);
			expect(
				parserService.getSongType(
					"Ride A White Horse (Serge Santiágo Re-Edit)",
				),
			).toBe(SongType.Remix);
		});
		it("Remix (Re-Mix)", () => {
			expect(
				parserService.getSongType(
					"Express Yourself (Shep's 'Spressin' Himself Re-Mix)",
				),
			).toBe(SongType.Remix);
		});

		it("Remix (Dub Mix)", () => {
			expect(parserService.getSongType("Fever (Dub Mix)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Dub)", () => {
			expect(parserService.getSongType("Fever (Dub)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Extended Dub)", () => {
			expect(parserService.getSongType("Fever (Extended Dub)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Dub Edit)", () => {
			expect(parserService.getSongType("Fever (Dub Edit)")).toBe(
				SongType.Remix,
			);
		});

		it("Remix (Beats)", () => {
			expect(parserService.getSongType("Fever (Beats)")).toBe(
				SongType.Remix,
			);
		});
		it("Remix (Jam Beats)", () => {
			expect(parserService.getSongType("Fever (Jam Beats)")).toBe(
				SongType.Remix,
			);
		});

		it("Demo (Demo)", () => {
			expect(parserService.getSongType("Fever (Demo)")).toBe(
				SongType.Demo,
			);
		});
		it("Demo (Alternative Mix)", () => {
			// In the UK, this is usually used to name a Demo version
			expect(parserService.getSongType("Fever (Alternative Mix)")).toBe(
				SongType.Demo,
			);
		});
		it("Demo (Demo 1)", () => {
			expect(parserService.getSongType("Fever (Demo 1)")).toBe(
				SongType.Demo,
			);
		});
		it("Demo (First Demo)", () => {
			expect(parserService.getSongType("Fever (First Demo)")).toBe(
				SongType.Demo,
			);
		});

		it("Demo (Rough Mix)", () => {
			expect(parserService.getSongType("Fever (Rough Mix)")).toBe(
				SongType.Demo,
			);
		});
		it("Demo (Rough Mix Edit)", () => {
			expect(parserService.getSongType("Fever (Rough Mix Edit)")).toBe(
				SongType.Demo,
			);
		});

		it("Live (Simple)", () => {
			expect(parserService.getSongType("Fever (Live)")).toBe(
				SongType.Live,
			);
		});
		it("Live (Live from)", () => {
			expect(parserService.getSongType("Fever (Live from X)")).toBe(
				SongType.Live,
			);
		});
		it("Live (Live at)", () => {
			expect(parserService.getSongType("Fever (Live at X)")).toBe(
				SongType.Live,
			);
		});
		it("Live (Live in)", () => {
			expect(parserService.getSongType("Fever (Live in X)")).toBe(
				SongType.Live,
			);
		});
		it("Live (Live Version)", () => {
			expect(parserService.getSongType("Fever (Live Version)")).toBe(
				SongType.Live,
			);
		});
		it("Live (Version Live)", () => {
			expect(parserService.getSongType("Fever (Version Live)")).toBe(
				SongType.Live,
			);
		});
		it("Live (Remixed)", () => {
			expect(parserService.getSongType("Fever (Remix) [Live]")).toBe(
				SongType.Live,
			);
		});
		it("Live (Live Edit)", () => {
			expect(parserService.getSongType("Fever (Live Edit from X)")).toBe(
				SongType.Live,
			);
		});

		it("Clean (Clean)", () => {
			expect(parserService.getSongType("Fever (Clean)")).toBe(
				SongType.Clean,
			);
		});
		it("Clean (Clean Version)", () => {
			expect(parserService.getSongType("Fever (Clean Version)")).toBe(
				SongType.Clean,
			);
		});
		it("Clean (Clean Edit)", () => {
			expect(parserService.getSongType("Fever (Clean Edit)")).toBe(
				SongType.Clean,
			);
		});

		it("Edit (Edit)", () => {
			expect(parserService.getSongType("Fever (Edit)")).toBe(
				SongType.Edit,
			);
		});
		it("Edit (Single Version)", () => {
			expect(parserService.getSongType("Fever (Single Version)")).toBe(
				SongType.Edit,
			);
		});
		it("Edit (Radio Version)", () => {
			expect(parserService.getSongType("Fever (Radio Version)")).toBe(
				SongType.Edit,
			);
		});
		it("Edit (7''Edit)", () => {
			expect(parserService.getSongType("Fever (7'' Edit)")).toBe(
				SongType.Edit,
			);
		});
		it('Edit (7" Edit)', () => {
			expect(parserService.getSongType('Fever (7" Edit)')).toBe(
				SongType.Edit,
			);
		});
		it("Edit (Edit Version)", () => {
			expect(parserService.getSongType("Fever (Edit Version)")).toBe(
				SongType.Edit,
			);
		});
		it("Edit (Album Edit)", () => {
			expect(parserService.getSongType("Fever (Album Edit)")).toBe(
				SongType.Edit,
			);
		});

		it("Acappella (Acapella)", () => {
			expect(
				parserService.getSongType("Don't Give It Up (Acapella)"),
			).toBe(SongType.Acappella);
		});
		it("Acappella (Various Spelling)", () => {
			expect(
				parserService.getSongType("Don't Give It Up (A Cappella)"),
			).toBe(SongType.Acappella);
			expect(
				parserService.getSongType("Don't Give It Up (Acappella)"),
			).toBe(SongType.Acappella);

			expect(parserService.getSongType("Irresistible (Accapella)")).toBe(
				SongType.Acappella,
			);
		});
		it("Acappella (Remix Acapella)", () => {
			expect(
				parserService.getSongType("Don't Give It Up (Remix Acappella)"),
			).toBe(SongType.Remix);
		});
		it("Non-Music (Photo Shoot/Gallery)", () => {
			expect(parserService.getSongType("Photo Gallery")).toBe(
				SongType.NonMusic,
			);
			expect(parserService.getSongType("Photo Shoot")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType(
					"The Truth About Love Photoshoot (Behind The Scenes)",
				),
			).toBe(SongType.NonMusic);
			expect(
				parserService.getSongType(
					"Girl On Film - Behind The Scenes At The Photo Shoot",
				),
			).toBe(SongType.NonMusic);
		});
		it("Non-Music (Documentary)", () => {
			expect(
				parserService.getSongType(
					"Little Bits Of Goldfrapp - Documentary",
				),
			).toBe(SongType.NonMusic);
			expect(
				parserService.getSongType(
					"Thanks For Your Uhh, Support (Documentary)",
				),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("Documentaire Exclusif")).toBe(
				SongType.NonMusic,
			);
			expect(parserService.getSongType("Documentaire Inedit")).toBe(
				SongType.NonMusic,
			);
		});
		it("Non-Music (Interview)", () => {
			expect(parserService.getSongType("The After Show Interview")).toBe(
				SongType.NonMusic,
			);
			expect(parserService.getSongType("Interview")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType(
					"Exclusive Interview With Girls Aloud",
				),
			).toBe(SongType.NonMusic);
		});
		it("Non-Music (Making Of)", () => {
			expect(
				parserService.getSongType("The Making Of Goodbye Lullaby"),
			).toBe(SongType.NonMusic);
			expect(
				parserService.getSongType("MTV's Making The Video: Toxic"),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("The Show (Making Of)")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType("Making Of 2 'City Of Love'"),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("So You Say (Making of)")).toBe(
				SongType.NonMusic,
			);
		});
		it("Non-Music (TV Special)", () => {
			expect(
				parserService.getSongType(
					'ABC Television Special: "Britney Spears: In The Zone"',
				),
			).toBe(SongType.NonMusic);
			expect(
				parserService.getSongType(
					"In The Zone Special (Exclusive Interview & Behind the Scenes Footage)",
				),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("MTV Special - The Show")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType("Making Of 2 'City Of Love'"),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("So You Say (Making of)")).toBe(
				SongType.NonMusic,
			);
		});
		it("Non-Music (Behind the Scenes)", () => {
			expect(parserService.getSongType("Smile (Behind The Scene)")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType("Walk This Way (Behind The Scenes)"),
			).toBe(SongType.NonMusic);
			expect(
				parserService.getSongType(
					"Triumph Of A Heart - Stories Behind The Music Video",
				),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("Behind The Scenes")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType(
					"Exclusive Behind-The-Scenes Footage",
				),
			).toBe(SongType.NonMusic);
		});
		it("Non-Music (Photo Shoot)", () => {
			expect(parserService.getSongType("Smile (Behind The Scene)")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType("Walk This Way (Behind The Scenes)"),
			).toBe(SongType.NonMusic);
			expect(
				parserService.getSongType(
					"Triumph Of A Heart - Stories Behind The Music Video",
				),
			).toBe(SongType.NonMusic);
			expect(parserService.getSongType("Behind The Scenes")).toBe(
				SongType.NonMusic,
			);
			expect(
				parserService.getSongType(
					"Exclusive Behind-The-Scenes Footage",
				),
			).toBe(SongType.NonMusic);
		});
		it("Non-Music (Voice Memo)", () => {
			expect(
				parserService.getSongType(
					"Blank Space (Guitar / Vocal Voice Memo)",
				),
			).toBe(SongType.NonMusic);
		});
		it("Non-Music (Advert)", () => {
			expect(
				parserService.getSongType(
					"Sound of the Udnerground (Album Advert)",
				),
			).toBe(SongType.NonMusic);
		});
		it("Mashups", () => {
			const f = (s: string) => parserService.getSongType(s);
			expect(f("Megamix")).toBe(SongType.Medley);
			expect(f("Album Megamix")).toBe(SongType.Medley);
			expect(f("Album Megamix")).toBe(SongType.Medley);
			expect(f("Chris Cox Megamix")).toBe(SongType.Medley);
			expect(f("Tommie Sunshine Megasix Smash-up")).toBe(SongType.Medley);
			expect(f("Tommie Sunshine Megasix Smash-up")).toBe(SongType.Medley);
			expect(f("Medley")).toBe(SongType.Medley);
			expect(f("Medley (Live)")).toBe(SongType.Live);
			expect(
				f("Like A Virgin/Hollywood Medley (2003 MTV VMA Performance)"),
			).toBe(SongType.Live);
		});
	});

	describe("Detect Album Type", () => {
		it("should identify title as studio album", () => {
			expect(parserService.getAlbumType("Into the Skyline")).toBe(
				AlbumType.StudioRecording,
			);
			expect(parserService.getAlbumType("Celebration")).toBe(
				AlbumType.StudioRecording,
			);
			expect(parserService.getAlbumType("Living Room")).toBe(
				AlbumType.StudioRecording,
			);
		});

		it("should identify title as live album", () => {
			expect(parserService.getAlbumType("Intimate & Live")).toBe(
				AlbumType.LiveRecording,
			);
			expect(parserService.getAlbumType("Some Album (Live)")).toBe(
				AlbumType.LiveRecording,
			);
			expect(
				parserService.getAlbumType("11,000 Click (Live at Brixton)"),
			).toBe(AlbumType.LiveRecording);
			expect(parserService.getAlbumType("Unplugged")).toBe(
				AlbumType.LiveRecording,
			);
			expect(parserService.getAlbumType("Live À Paris")).toBe(
				AlbumType.LiveRecording,
			);
		});

		it("should identify title as compilation album", () => {
			expect(
				parserService.getAlbumType("Happy BusDay: Best of Superbus"),
			).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType("The Very Best of Moby")).toBe(
				AlbumType.Compilation,
			);
			expect(parserService.getAlbumType("The Singles Collection")).toBe(
				AlbumType.Compilation,
			);
			expect(
				parserService.getAlbumType("The Immaculate Collection"),
			).toBe(AlbumType.Compilation);
			expect(
				parserService.getAlbumType("Greatest Hits: My Prerogative"),
			).toBe(AlbumType.Compilation);
			expect(parserService.getAlbumType("A decade of Hits")).toBe(
				AlbumType.Compilation,
			);
		});

		it("should identify title as video album", () => {
			expect(parserService.getAlbumType("Britney: The Videos")).toBe(
				AlbumType.VideoAlbum,
			);
			expect(
				parserService.getAlbumType(
					"Greatest Hits: My Prerogative - The Videos",
				),
			).toBe(AlbumType.VideoAlbum);
			expect(
				parserService.getAlbumType(
					"Celebration - The Video Collection",
				),
			).toBe(AlbumType.VideoAlbum);
			expect(
				parserService.getAlbumType("The Video Collection 93:99"),
			).toBe(AlbumType.VideoAlbum);
			expect(parserService.getAlbumType("Music Videos")).toBe(
				AlbumType.VideoAlbum,
			);
			expect(parserService.getAlbumType("Music Videos II")).toBe(
				AlbumType.VideoAlbum,
			);
			expect(parserService.getAlbumType("In The Zone DVD")).toBe(
				AlbumType.VideoAlbum,
			);
		});
		it("should identify title as remix album", () => {
			expect(
				parserService.getAlbumType("B In The Mix: The Remixes"),
			).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType("Rated R: Remixed")).toBe(
				AlbumType.RemixAlbum,
			);
			expect(
				parserService.getAlbumType("Move To This - Remix Album"),
			).toBe(AlbumType.RemixAlbum);
			expect(
				parserService.getAlbumType('Essential Mixes - 12" Masters'),
			).toBe(AlbumType.RemixAlbum);
			expect(
				parserService.getAlbumType("Everybody Move (To The Mixes)"),
			).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType("Dance Remixes")).toBe(
				AlbumType.RemixAlbum,
			);
			expect(
				parserService.getAlbumType(
					"The Best Mixes From The Album Debut",
				),
			).toBe(AlbumType.RemixAlbum);
			expect(parserService.getAlbumType("Mixes")).toBe(
				AlbumType.RemixAlbum,
			);
		});

		it("should identify title as soundtrack album", () => {
			expect(
				parserService.getAlbumType(
					"Evita: The Complete Motion Picture Music Soundtrack",
				),
			).toBe(AlbumType.Soundtrack);
			expect(
				parserService.getAlbumType(
					"Who's That Girl (Original Motion Picture Soundtrack)",
				),
			).toBe(AlbumType.Soundtrack);
			expect(
				parserService.getAlbumType("Berlin Calling (The Soundtrack)"),
			).toBe(AlbumType.Soundtrack);
			expect(
				parserService.getAlbumType(
					"Desperate Housewives (Music From and Inspired By The Television Series)",
				),
			).toBe(AlbumType.Soundtrack);
			expect(
				parserService.getAlbumType(
					"The Next Best Thing: Music From the Motion Picture",
				),
			).toBe(AlbumType.Soundtrack);
			expect(
				parserService.getAlbumType(
					"8 femmes (Bande originale du film)",
				),
			).toBe(AlbumType.Soundtrack);
		});

		it("should identify title as single", () => {
			expect(parserService.getAlbumType("Twist - Single")).toBe(
				AlbumType.Single,
			);
			expect(parserService.getAlbumType("Twist - EP")).toBe(
				AlbumType.Single,
			);
			expect(parserService.getAlbumType("Falling (Remixes)")).toBe(
				AlbumType.Single,
			);
		});
	});

	describe("Extract Release name's extension", () => {
		it("should build the album name from a basic release name", () => {
			expect(
				parserService.parseReleaseExtension("My Album").parsedName,
			).toBe("My Album");
			expect(
				parserService.parseReleaseExtension("My New Album").parsedName,
			).toBe("My New Album");
		});

		it("should build the album name from a release name with a basic extension", () => {
			expect(
				parserService.parseReleaseExtension("My Album (Deluxe Edition)")
					.parsedName,
			).toBe("My Album");
			expect(
				parserService.parseReleaseExtension(
					"My New Album (Edited Special Edition)",
				).parsedName,
			).toBe("My New Album");
		});

		it("should build the album name from a release name with a medium extension", () => {
			expect(
				parserService.parseReleaseExtension(
					"Garbage (20th Anniversary Deluxe Edition)",
				).parsedName,
			).toBe("Garbage");
		});

		it("should build the album name from a release name with a suffix ", () => {
			expect(
				parserService.parseReleaseExtension("My Album (Right Now)")
					.parsedName,
			).toBe("My Album (Right Now)");
		});

		it("should build the album name from a release name with a prefix ", () => {
			expect(
				parserService.parseReleaseExtension("(Right Now) My Album")
					.parsedName,
			).toBe("(Right Now) My Album");
		});

		it("should build the album name from a release name with a basic extension and a suffix ", () => {
			expect(
				parserService.parseReleaseExtension(
					"My Album (Right Now) [Deluxe Edition]",
				).parsedName,
			).toBe("My Album (Right Now)");
		});

		it("should build the album name from a release name with a basic extension and a prefix ", () => {
			expect(
				parserService.parseReleaseExtension(
					"(Right Now) My Album [Deluxe Edition]",
				).parsedName,
			).toBe("(Right Now) My Album");
		});
		it("should remove the 'Remaster' extension", () => {
			expect(
				parserService.parseReleaseExtension("My Album [2022 Remaster]")
					.parsedName,
			).toBe("My Album");
		});
		it("should remove the 'remastered' extension", () => {
			expect(
				parserService.parseReleaseExtension(
					"My Album [2022 Remastered]",
				).parsedName,
			).toBe("My Album");
		});

		it("should remove the 'remastered version' extension", () => {
			const parsed = parserService.parseReleaseExtension(
				"My Album [2022 Remastered version]",
			);
			expect(parsed.parsedName).toBe("My Album");
			expect(parsed.extensions).toStrictEqual([
				"2022 Remastered version",
			]);
		});

		it("should remove the 'remaster' extension, lowercase", () => {
			expect(
				parserService.parseReleaseExtension("My Album [2022 Remaster]")
					.parsedName,
			).toBe("My Album");
		});

		it("should remove multiple extensions", () => {
			expect(
				parserService.parseReleaseExtension(
					"My Album  (Deluxe)  [2022 Remaster] ",
				).parsedName,
			).toBe("My Album");
		});
		it("should remove w/ tricky name", () => {
			expect(
				parserService.parseReleaseExtension(
					"Version 2.0 (20th Anniversary Deluxe Edition)",
				).parsedName,
			).toBe("Version 2.0");
		});

		it("should extract single identifier from name", () => {
			const res = parserService.parseReleaseExtension(
				"My Single (12'' Vinyl) - Single",
			);
			expect(res.parsedName).toBe("My Single - Single");
			expect(res.extensions).toStrictEqual(["12'' Vinyl"]);
		});
	});

	describe("Extract Track name's extension", () => {
		it("should build the song name from a track name with a basic extension", () => {
			expect(
				parserService.parseTrackExtensions("My Song (Album Mix)")
					.parsedName,
			).toBe("My Song");
		});
		it("should build the song name from a track name with a basic extension", () => {
			expect(
				parserService.parseTrackExtensions("My Song (Music Video)")
					.parsedName,
			).toBe("My Song");
		});

		it("should build the song name from a track name with an even more basic extension", () => {
			expect(
				parserService.parseTrackExtensions("My Song (Video)")
					.parsedName,
			).toBe("My Song");
		});

		it("should build the song name from a track name with a normal extension", () => {
			expect(
				parserService.parseTrackExtensions(
					"My Song (Official Music Video)",
				).parsedName,
			).toBe("My Song");
		});

		it("should remove 'remaster' extension", () => {
			const parsed = parserService.parseTrackExtensions(
				"My Song  (remastered)",
			);
			expect(parsed.parsedName).toBe("My Song");
			expect(parsed.remastered).toBe(true);
		});
		it("should remove 'bonus track' extension", () => {
			const parsed = parserService.parseTrackExtensions(
				"My Song  (Bonus Track)",
			);
			expect(parsed.parsedName).toBe("My Song");
			expect(parsed.bonus).toBe(true);
		});
		it("should remove 'bonus track' extension (lowercase)", () => {
			const parsed = parserService.parseTrackExtensions(
				"my song (bonus track)",
			);
			expect(parsed.parsedName).toBe("my song");
			expect(parsed.bonus).toBe(true);
		});
		it("should remove 'Album Version' extension", () => {
			expect(
				parserService.parseTrackExtensions("My Song  (Album Version)")
					.parsedName,
			).toBe("My Song");
		});

		it("should remove 'Main Version' extension", () => {
			expect(
				parserService.parseTrackExtensions("My Song  (Main Version)")
					.parsedName,
			).toBe("My Song");
		});

		it("should remove multiple extensions", () => {
			expect(
				parserService.parseTrackExtensions(
					"My Song  {Music Video}  (Remaster)",
				).parsedName,
			).toBe("My Song");
		});

		it("should not remove extension (Non-specfic trailing group)", () => {
			expect(
				parserService.parseTrackExtensions("My Song (Yeah)").parsedName,
			).toBe("My Song (Yeah)");
		});

		it("should not remove extension ('Live from Music Video Award')", () => {
			expect(
				parserService.parseTrackExtensions(
					"I'm A Slave 4 U (Live from 2001 MTV Video Music Awards)",
				).parsedName,
			).toBe("I'm A Slave 4 U (Live from 2001 MTV Video Music Awards)");
		});

		it("should not remove extension ('Extended Album Version')", () => {
			expect(
				parserService.parseTrackExtensions(
					"Jump (Extended Album Version)",
				).parsedName,
			).toBe("Jump (Extended Album Version)");
		});

		it("should not remove extension ('Video Edit')", () => {
			expect(
				parserService.parseTrackExtensions("My Song (Video Edit)")
					.parsedName,
			).toBe("My Song (Video Edit)");
		});

		it("should not remove extension ('Video Mix')", () => {
			expect(
				parserService.parseTrackExtensions("My Song (Video Mix)")
					.parsedName,
			).toBe("My Song (Video Mix)");
		});

		it("should not remove extension ('Video Mix Instrumental')", () => {
			expect(
				parserService.parseTrackExtensions(
					"Me Against the Music (Video Mix Instrumental)",
				).parsedName,
			).toBe("Me Against the Music (Video Mix Instrumental)");
		});
		it("should not reorder ('A (B - C) {D}')", () => {
			expect(
				parserService.parseTrackExtensions("A (B - C) {D}").parsedName,
			).toBe("A (B - C) {D}");
		});
		it("should not reorder (Real example)", () => {
			expect(
				parserService.parseTrackExtensions(
					"Crooked Madam (Damn Mad - Shellfish Remix)",
				).parsedName,
			).toBe("Crooked Madam (Damn Mad - Shellfish Remix)");
		});
		it("should not reorder ('A - B (C) - D {E}')", () => {
			expect(
				parserService.parseTrackExtensions("A - B (C) - D {E}")
					.parsedName,
			).toBe("A - B (C) - D {E}");
		});
	});
});
