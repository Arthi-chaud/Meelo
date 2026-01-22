import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { AlbumType, SongType, VideoType } from "src/prisma/generated/client";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import ParserModule from "./parser.module";
import ParserService from "./parser.service";

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
					sortName: "Christine & The Queens",
					sortSlug: "christine-the-queens",
				},
			})
			.catch(() => {});
		await prismaService.artist
			.create({
				data: {
					name: "Me & My Monkey",
					slug: "me-my-monkey",
					sortName: "Me & My Monkey",
					sortSlug: "me-my-monkey",
				},
			})
			.catch(() => {});
		await prismaService.artist
			.create({
				data: {
					name: "Miss Kittin & The Hacker",
					slug: "miss-kittin-the-hacker",
					sortName: "Miss Kittin & The Hacker",
					sortSlug: "miss-kittin-the-hacker",
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
		const scenarios = [
			["Strict Machine", undefined],
			["Me Against the Music (feat. Madonna)", "Me Against the Music"],
			[
				"Me Against the Music    [feat. Madonna]  [Remix A]   (Edit B)",
				"Me Against the Music",
			],
			["A - B", "A"],
			["A (B)", "A"],
			["(A) B", "B"],
			["(A) B - C [D]", "B"],
		] as const;

		for (const [unparsedName, expectedName] of scenarios) {
			test(unparsedName, () => {
				const res = parserService.stripGroups(unparsedName);
				expect(res).toBe(expectedName ?? unparsedName);
			});
		}
	});

	describe("Split Groups", () => {
		const scenarios = [
			["Strict Machine", ["Strict Machine"]],
			[
				"Me Against the Music (feat. Madonna)",
				["Me Against the Music", "feat. Madonna"],
			],
			["A - B", ["A", "B"]],
			[
				"Me Against the Music (feat. Madonna)  [Remix]",
				["Me Against the Music", "feat. Madonna", "Remix"],
			],
			[
				"Me Against the Music (feat. Madonna)  (Remix)",
				["Me Against the Music", "feat. Madonna", "Remix"],
			],
			[
				"Me Against the Music (feat. Madonna)[Remix]",
				["Me Against the Music", "feat. Madonna", "Remix"],
			],
			[
				"Me Against the Music (feat. Madonna) [Remix A ]  {Edit B}",
				["Me Against the Music", "feat. Madonna", "Remix A", "Edit B"],
			],
			[
				"Me Against the Music [feat. Madonna] [Remix A] (Edit B)",
				["Me Against the Music", "feat. Madonna", "Remix A", "Edit B"],
			],
			[
				"Me Against the Music [feat. Madonna  [Remix A] (Edit B)]",
				["Me Against the Music", "feat. Madonna", "Remix A", "Edit B"],
			],
			[
				"Me Against the Music [feat. Madonna  [Remix A] (Edit B)] [Version C]",
				[
					"Me Against the Music",
					"feat. Madonna",
					"Remix A",
					"Edit B",
					"Version C",
				],
			],
			[
				"Me Against the Music (feat. Madonna) - Remix A (Edit B)",
				["Me Against the Music", "feat. Madonna", "Remix A", "Edit B"],
			],
		] as const;

		for (const [unparsed, expected] of scenarios) {
			test(unparsed, () => {
				const res = parserService.splitGroups(unparsed);
				expect(res).toStrictEqual(expected);
			});
		}

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

				"4 Minutes",
				["Justin Timberlake", "Timbaland"],
			],
			[
				"4 Minutes (feat. Justin Timberlake) [feat. Timbaland]",

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
			["Iggy Azalea;Tyga", "Iggy Azalea", ["Tyga"]],
			["Iggy Azalea ; Tyga", "Iggy Azalea", ["Tyga"]],
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
				["Me & My Monkey"],
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
					"Live to Tell",
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
						"Wait for Me EPK",
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

	describe("Get Video Type", () => {
		const scenarios = [
			[
				VideoType.MusicVideo,
				[
					"A (Video)",
					"A (Clip Video)",
					"A (Official Music Video)",
					"A (Music Video)",
					"Live to Tell",
				],
			],
			[
				VideoType.LyricsVideo,
				[
					"A (Lyric Video)",
					"A (Lyrics Video)",
					"A (Lyrics)",
					"A (Official Lyric Video)",
				],
			],
			[VideoType.Advert, ["Sound of the Udnerground (Album Advert)"]],
			[
				VideoType.Interview,
				[
					"The After Show Interview",
					"Interview",
					"Exclusive Interview With Girls Aloud",

					'ABC Television Special: "Britney Spears: In The Zone"',
					"In The Zone Special (Exclusive Interview & Behind the Scenes Footage)",
					"MTV Special - The Show",
					"Wait for Me EPK",
				],
			],
			[VideoType.Live, ["Fever (Live)"]],
			[
				VideoType.Documentary,
				[
					"Little Bits Of Goldfrapp - Documentary",
					"Thanks For Your Uhh, Support (Documentary)",
					"Documentaire Exclusif",
					"Documentaire Inedit",
				],
			],
			[
				VideoType.BehindTheScenes,
				[
					"Photo Shoot",
					"The Truth About Love Photoshoot (Behind The Scenes)",
					"Girl On Film - Behind The Scenes At The Photo Shoot",
					"Making Of 2 'City Of Love'",
					"So You Say (Making of)",
					"Smile (Behind The Scene)",
					"Walk This Way (Behind The Scenes)",
					"Behind The Scenes",
					"The Making Of Goodbye Lullaby",
					"MTV's Making The Video: Toxic",
					"The Show (Making Of)",
					"Making Of 2 'City Of Love'",
					"So You Say (Making of)",
					"Triumph Of A Heart - Stories Behind The Music Video",
					"Exclusive Behind-The-Scenes Footage",
					"Smile (Behind The Scene)",
					"A (B-Roll)",
					"A (B-Roll Footage)",
				],
			],
			[VideoType.PhotoGallery, ["Photo Gallery"]],
		] as const;
		for (const [expectedVideoType, videoNames] of scenarios) {
			describe(expectedVideoType, () => {
				for (const videoName of videoNames) {
					test(videoName, () =>
						expect(parserService.getVideoType(videoName)).toBe(
							expectedVideoType,
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
				[
					"Into the Skyline",
					"Celebration",
					"Living Room",
					// See https://github.com/Arthi-chaud/Meelo/issues/1089
					"Alive or Just Breathing",
					"Danger Days: The True Lives Of The Fabulous Killjoys",
					"Outlive You All",
					"Deliverance and Damnation",
				],
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
			[AlbumType.EP, ["Twist - EP"]],
			[AlbumType.Single, ["Twist - Single", "Falling (Remixes)"]],
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
		const scenarios = [
			["My Album", undefined, []],
			["My New Album", undefined, []],

			["My Album (Deluxe Edition)", "My Album", ["Deluxe Edition"]],
			[
				"My New Album (Edited Special Edition)",
				"My New Album",
				["Edited Special Edition"],
			],
			[
				"Garbage (20th Anniversary Deluxe Edition)",
				"Garbage",
				["20th Anniversary Deluxe Edition"],
			],
			["My Album (Right Now)", undefined, []],
			["(Right Now) My Album", undefined, []],
			[
				"My Album (Right Now) [Deluxe Edition]",
				"My Album (Right Now)",
				["Deluxe Edition"],
			],

			[
				"(Right Now) My Album [Deluxe Edition]",
				"(Right Now) My Album",
				["Deluxe Edition"],
			],
			["My Album [2022 Remaster]", "My Album", ["2022 Remaster"]],
			["My Album [2022 remaster]", "My Album", ["2022 remaster"]],
			["My Album [2022 Remastered]", "My Album", ["2022 Remastered"]],
			[
				"My Album  (Deluxe)  [2022 Remaster] ",
				"My Album",
				["Deluxe", "2022 Remaster"],
			],
			[
				"My Single (12'' Vinyl) - Single",
				"My Single - Single",
				["12'' Vinyl"],
			],
			[
				"Version 2.0 (20th Anniversary Deluxe Edition)",
				"Version 2.0",
				["20th Anniversary Deluxe Edition"],
			],
			[
				"My Album [2022 Remastered version]",
				"My Album",
				["2022 Remastered version"],
			],
		] as const;

		for (const [
			unparsedReleaseName,
			expectedReleaseName,
			expectedExtensions,
		] of scenarios) {
			test(unparsedReleaseName, () => {
				const { parsedName, extensions } =
					parserService.parseReleaseExtension(unparsedReleaseName);

				expect(parsedName).toBe(
					expectedReleaseName ?? unparsedReleaseName,
				);

				expect(extensions).toStrictEqual(expectedExtensions);
			});
		}
	});

	describe("Extract Track name's extension", () => {
		const scenarios = [
			["My Song (Yeah)", undefined, undefined],
			[
				"I'm A Slave 4 U (Live from 2001 MTV Video Music Awards)",
				undefined,
				undefined,
			],
			[
				"Me Against the Music (Video Mix Instrumental)",
				undefined,
				undefined,
			],
			["My Song (Video Edit)", undefined, undefined],
			["My Song (Video Mix)", undefined, undefined],
			[
				"Don't Tell Me (Thunderpass Video Remix)",
				undefined,
				{ video: false },
			],
			["Jump (Extended Album Version)", undefined, undefined],
			["My Song (Album Mix)", "My Song", undefined],
			["My Song (Music Video)", "My Song", undefined],
			["My Song (Video)", "My Song", undefined],
			["My Song (Official Music Video)", "My Song", undefined],
			["My Song  (remastered)", "My Song", { remastered: true }],
			["My Song  (Bonus Track)", "My Song", { bonus: true }],
			["my song (bonus track)", "my song", { bonus: true }],
			["My Song (Album Version)", "My Song", undefined],
			["My Song (Main Version)", "My Song", undefined],
			[
				"My Song  {Music Video}  (Remaster)",
				"My Song",
				{ remastered: true },
			],

			["A (B - C) {D}", undefined, undefined],
			[
				"Crooked Madam (Damn Mad - Shellfish Remix)",
				undefined,
				undefined,
			],
			["A - B (C) - D {E}", "A - B (C) - D {E}", undefined],
		] as const;
		for (const [
			unparsedTrackName,
			expectedTrackName,
			expectedExtensions,
		] of scenarios) {
			test(unparsedTrackName, () => {
				const { parsedName, ...extensions } =
					parserService.parseTrackExtensions(unparsedTrackName);

				expect(parsedName).toBe(expectedTrackName ?? unparsedTrackName);

				if (expectedExtensions) {
					for (const [key, value] of Object.entries(extensions)) {
						if (key in Object.keys(expectedExtensions)) {
							expect(value).toBe(
								(expectedExtensions as any)[key],
							);
						}
					}
				}
			});
		}
	});
});
