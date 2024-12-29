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
import { Allow } from "class-validator";

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
		const scenarios = [
			["Strict Machine", "Strict Machine", []],
			[
				"Me Against the Music (feat. Madonna)",
				"Me Against the Music",
				["Madonna"],
			],

			[
				"Me Against the Music feat. Madonna",
				"Me Against the Music",
				["Madonna"],
			],

			[
				"Me Against the Music (featuring Madonna)",
				"Me Against the Music",
				["Madonna"],
			],

			[
				"Me Against the Music (With Madonna)",
				"Me Against the Music",
				["Madonna"],
			],
			[
				"Me Against the Music (Featuring Madonna)",
				"Me Against the Music",
				["Madonna"],
			],
			[
				"Medellín (Offer Nissim Madame X In The Sphinx Mix) [feat. Maluma]",
				"Medellín (Offer Nissim Madame X In The Sphinx Mix)",
				["Maluma"],
			],

			[
				"Medellín (feat. Maluma) [Offer Nissim Madame X In The Sphinx Mix]",
				"Medellín (Offer Nissim Madame X In The Sphinx Mix)",
				["Maluma"],
			],

			[
				"4 Minutes (feat. Justin Timberlake & Timbaland)",
				,
				"4 Minutes",
				["Justin Timberlake", "Timbaland"],
			],
			[
				"4 Minutes (feat. Justin Timberlake) [feat. Timbaland]",
				,
				"4 Minutes",
				["Justin Timberlake", "Timbaland"],
			],
			[
				"4 Minutes (Remix) [feat. Justin Timberlake & Timbaland]",
				"4 Minutes (Remix)",
				["Justin Timberlake", "Timbaland"],
			],
			[
				"4 Minutes featuring Justin Timberlake & Timbaland (Remix)",
				"4 Minutes (Remix)",
				["Justin Timberlake", "Timbaland"],
			],
			[
				"Champion (feat. Nas, Drake & Young Jeezy)",
				"Champion",
				["Nas", "Drake", "Young Jeezy"],
			],
			[
				"Champion (feat. Nas, Drake, Young Jeezy & Someone)",
				"Champion",
				["Nas", "Drake", "Young Jeezy", "Someone"],
			],

			["Champion (With Someone)", "Champion", ["Someone"]],
			[
				"You Lied To Me (Sprayed With Shep's Attitude)",
				"You Lied To Me (Sprayed With Shep's Attitude)",
				[],
			],
			[
				"You Lied To Me (Remix Feat. Shep Pettibone)",
				"You Lied To Me (Remix)",
				["Shep Pettibone"],
			],
			[
				"Crooked Madam (Damn Mad - Shellfish Remix)",
				"Crooked Madam (Damn Mad - Shellfish Remix)",
				[],
			],
			["Good Times With Bad People", "Good Times With Bad People", []],
		] as const;

		for (const [
			unparsedSongName,
			expectedSongName,
			expectedFeaturing,
		] of scenarios) {
			test(unparsedSongName, async () => {
				const { name, featuring } =
					await parserService.extractFeaturedArtistsFromSongName(
						unparsedSongName,
					);
				expect(name).toBe(expectedSongName);
				expect(featuring).toEqual(expectedFeaturing);
			});
		}
	});

	describe("Extract artists name from artist name", () => {
		const scenarios = [
			["Madonna", undefined, []],
			["Everything But The Girl", undefined, []],
			["Iggy Azalea & Tyga", "Iggy Azalea", ["Tyga"]],
			["Clean Bandit feat. Jess Glyne", "Clean Bandit", ["Jess Glyne"]],
			["Clean Bandit (feat. Jess Glyne)", "Clean Bandit", ["Jess Glyne"]],
			["Clean Bandit Feat. Jess Glyne", "Clean Bandit", ["Jess Glyne"]],
			[
				"Clean Bandit Featuring Jess Glyne",
				"Clean Bandit",
				["Jess Glyne"],
			],
			["Christine & The Queens", undefined, []],
			["Miss Kittin & The Hacker", undefined, []],
			[
				"Robin Schulz & Me & My Monkey",
				"Robin Schulz",
				[" Me & My Monkey"],
			],
			[
				"Charli XCX, Caroline Polacheck & Christine",
				"Charli XCX",
				["Caroline Polacheck", "Christine"],
			],
			[
				"Clean Bandit Featuring Jess Glyne & BBBB",
				"Clean Bandit",
				["Jess Glyne", "BBBB"],
			],

			[
				"Clean Bandit Featuring Jess Glyne, BBBB & CCCC",
				"Clean Bandit",
				["Jess Glyne", "BBBB", "CCCC"],
			],
			["Snoop Dogg Vs. David Guetta", "Snoop Dogg", ["David Guetta"]],
			["Snoop Dogg Vs David Guetta", "Snoop Dogg", ["David Guetta"]],
		] as const;
		for (const [
			unparsedArtistName,
			expectedArtistName,
			expectedFeaturing,
		] of scenarios) {
			test(unparsedArtistName, async () => {
				const { artist, featuring } =
					await parserService.extractFeaturedArtistsFromArtistName(
						unparsedArtistName,
					);
				expect(artist).toBe(expectedArtistName ?? unparsedArtistName);
				expect(featuring).toEqual(expectedFeaturing);
			});
		}
	});

	describe("Get Song Type", () => {
		const scenarios = [
			[
				SongType.Original,
				[
					"My Song",
					"My Song (Album Version)",
					"My Song (Main Version)",
					"My Song (Original Version)",
					"My Song (Original Mix)",
					"My Song (feat. A)",
					"Heart Beats",
					"Clean",
					"Live",
					"Credits",
				],
			],
			[
				SongType.Acoustic,
				[
					"Live It Up (Acoustic Version)",
					"Live It Up (Acoustic)",
					"Live It Up (Acoustic Mix)",
					"Live It Up (Acoustic Remix)",
				],
			],
			[
				SongType.Instrumental,
				[
					"My Song (Instrumental)",
					"My Song (Instrumental Version)",
					"My Song (Version Instrumentale)",
					"My Song (Instrumental Mix)",
					"Deeper And Deeper (Shep's Deepstrumental)",
				],
			],
			[
				SongType.Remix,
				[
					"Fever (Extended 12'')",
					'Fever (Extended 12")',
					"Jump (Extended Album Vetsion)",
					"Deeper And Deeper (Shep's Classic 12'')",
					"Deeper And Deeper (Shep's Classic 12\")",
					"Freak Like Me (BRITS 2003 Version)",
					"Too Lost In You (Love Actually Version)",
					"Sorry (PSB Maxi-Mix)",
					"Optimistique-Moi (Opti-Mix-tic)",
					"Fever (7'' Mix)",
					'Fever (7" Remix)',
					"Fever (Olliver Helden Remix)",
					"Fever (Extended Mix)",
					"Fever (Extended Mix)",
					"Fever (Extended Mix Edit)",
					"Fever (Ambiant Mix)",
					"Fever (Remix)[Radio Edit]",
					"Fever (Rock Mix)",
					"Fever (Remix Edit)",
					"Sing It Back (Can 7 Supermarket Mix Edit)",
					"Sing It Back (Can 7 Supermarket Vocal Edit)",
					"Fever (Radio Mix)",
					"Fever (Instrumental Break Down Mix)",
					"Fever (Electro Bashment Instrumental Remix)",
					"Ooh La La (Phones Re-Edit)",
					"Ride A White Horse (Serge Santiágo Re-Edit)",
					"Express Yourself (Shep's 'Spressin' Himself Re-Mix)",
					"Fever (Dub Mix)",
					"Fever (Dub)",
					"Fever (Extended Dub)",
					"Fever (Dub Edit)",
					"Fever (Beats)",
					"Fever (Jam Beats)",
					"Don't Give It Up (Remix Acappella)",
				],
				[
					SongType.Demo,
					[
						"Fever (Demo)",
						"Fever (Alternative Mix)",
						"Fever (Demo 1)",
						"Fever (First Demo)",
						"Fever (Rough Mix)",
						"Fever (Rough Mix Edit)",
					],
				],
				[
					SongType.Live,
					[
						"Fever (Live)",
						"Fever (Live from X)",
						"Fever (Live at X)",
						"Fever (Live in X)",
						"Fever (Live Version)",
						"Fever (Version Live)",
						"Fever (Remix) [Live]",
						"Fever (Live Edit from X)",
						"Medley (Live)",
						"Like A Virgin/Hollywood Medley (2003 MTV VMA Performance)",
					],
				],
				[
					SongType.Clean,
					[
						"Fever (Clean)",
						"Fever (Clean Version)",
						"Fever (Clean Edit)",
					],
				],
				[
					SongType.Edit,
					[
						"Fever (Edit)",
						"Fever (Single Version)",
						"Fever (Radio Version)",
						"Fever (7'' Edit)",
						'Fever (7" Edit)',
						"Fever (Edit Version)",
						"Fever (Album Edit)",
					],
				],
				[
					SongType.Acappella,
					[
						"Don't Give It Up (Acapella)",
						"Don't Give It Up (A Cappella)",
						"Don't Give It Up (Acappella)",
						"Irresistible (Accapella)",
					],
				],
				[
					SongType.Medley,
					[
						"Megamix",
						"Album Megamix",
						"Album Megamix",
						"Chris Cox Megamix",
						"Tommie Sunshine Megasix Smash-up",
					],
				],
				[
					SongType.NonMusic,
					[
						"Photo Gallery",
						"Photo Shoot",
						"The Truth About Love Photoshoot (Behind The Scenes)",
						"Girl On Film - Behind The Scenes At The Photo Shoot",
						"Little Bits Of Goldfrapp - Documentary",
						"Thanks For Your Uhh, Support (Documentary)",
						"Documentaire Exclusif",
						"Documentaire Inedit",
						"The After Show Interview",
						"Interview",
						"Exclusive Interview With Girls Aloud",
						"The Making Of Goodbye Lullaby",
						"MTV's Making The Video: Toxic",
						"The Show (Making Of)",
						"Making Of 2 'City Of Love'",
						"So You Say (Making of)",
						'ABC Television Special: "Britney Spears: In The Zone"',
						"In The Zone Special (Exclusive Interview & Behind the Scenes Footage)",
						"MTV Special - The Show",
						"Making Of 2 'City Of Love'",
						"So You Say (Making of)",
						"Smile (Behind The Scene)",
						"Walk This Way (Behind The Scenes)",
						"Behind The Scenes",
						"Exclusive Behind-The-Scenes Footage",
						"Smile (Behind The Scene)",
						"Triumph Of A Heart - Stories Behind The Music Video",
						"Blank Space (Guitar / Vocal Voice Memo)",
						"Sound of the Udnerground (Album Advert)",
					],
				],
			],
		] as const;
		for (const [expectedSongType, songNames] of scenarios) {
			describe(expectedSongType, () => {
				for (const songName of songNames) {
					test(songName, () =>
						expect(parserService.getSongType(songName)).toBe(
							expectedSongType,
						),
					);
				}
			});
		}
	});

	describe("Detect Album Type", () => {
		const scenarios = [
			[
				AlbumType.StudioRecording,
				["Into the Skyline", "Celebration", "Living Room"],
			],
			[
				AlbumType.LiveRecording,
				[
					"Intimate & Live",
					"Some Album (Live)",
					"11,000 Click (Live at Brixton)",
					"Unplugged",
					"Live À Paris",
				],
			],
			[
				AlbumType.Compilation,
				[
					"Happy BusDay: Best of Superbus",

					"The Very Best of Moby",
					"The Singles Collection",
					"Immaculate Collection",
					"Greatest Hits: My Prerogative",
					"A decade of Hits",
				],
			],
			[
				AlbumType.VideoAlbum,
				[
					"Britney: The Videos",
					"Greatest Hits: My Prerogative - The Videos",
					"Celebration - The Video Collection",
					"The Video Collection 93:99",
					"Music Videos",
					"Music Videos II",
					"In The Zone DVD",
				],
			],
			[
				AlbumType.RemixAlbum,
				[
					"B In The Mix: The Remixes",
					"Rated R: Remixed",
					"Move To This - Remix Album",
					'Essential Mixes - 12" Masters',
					"Everybody Move (To The Mixes)",
					"Dance Remixes",
					"The Best Mixes From The Album Debut",
					"Mixes",
				],
			],
			[
				AlbumType.Soundtrack,
				[
					"Who's That Girl (Original Motion Picture Soundtrack)",
					"Evita: The Complete Motion Picture Music Soundtrack",
					"Berlin Calling (The Soundtrack)",
					"Desperate Housewives (Music From and Inspired By The Television Series)",
					"The Next Best Thing: Music From the Motion Picture",
					"8 femmes (Bande originale du film)",
					"Challengers: Original Score",
				],
			],
			[
				AlbumType.Single,
				["Twist - Single", "Twist - EP", "Falling (Remixes)"],
			],
		] as const;
		for (const [expectedAlbumType, albumNames] of scenarios) {
			describe(expectedAlbumType, () => {
				for (const albumName of albumNames) {
					test(albumName, () =>
						expect(parserService.getAlbumType(albumName)).toBe(
							expectedAlbumType,
						),
					);
				}
			});
		}
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
