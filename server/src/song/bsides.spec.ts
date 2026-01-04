import { TestingModule } from "@nestjs/testing";
import {
	Album,
	AlbumType,
	Artist,
	Release,
	Song,
	SongType,
	Track,
	TrackType,
} from "src/prisma/generated/client";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import Slug from "src/slug/slug";
import { getSortName } from "src/sort/sort-name";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import SongModule from "./song.module";
import SongService from "./song.service";

describe("Get B-Sides", () => {
	let songService: SongService;
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				ArtistModule,
				TrackModule,
				AlbumModule,
				IllustrationModule,
				GenreModule,
				LyricsModule,
				ReleaseModule,
				SongModule,
				ParserModule,
			],
			providers: [SongService, ArtistService, PrismaService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		songService = module.get(SongService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	const mkSimpleArtist = (name: string) =>
		dummyRepository.artist.create({
			data: {
				name,
				slug: new Slug(name).toString(),
				sortName: getSortName(name),
				sortSlug: new Slug(getSortName(name)).toString(),
			},
		});

	const mkSimpleAlbum = async (
		name: string,
		extensions: string[],
		type: AlbumType,
		artist: Artist,
		releaseDate?: Date,
	): Promise<[Album, Release]> => {
		const album = await dummyRepository.album.create({
			data: {
				name,
				slug: new Slug(`${artist.name} ${name}`).toString(),
				nameSlug: new Slug(name).toString(),
				sortName: getSortName(name),
				sortSlug: new Slug(getSortName(name)).toString(),
				artistId: artist.id,
				releaseDate,
				type,
			},
		});
		const master = await mkSimpleRelease(album, artist, extensions);
		await dummyRepository.album.update({
			where: { id: album.id },
			data: { masterId: master.id },
		});
		album.masterId = master.id;
		return [album, master];
	};

	const mkSimpleRelease = (
		album: Album,
		artist: Artist,
		extensions: string[],
	) => {
		return dummyRepository.release.create({
			data: {
				name: album.name,
				slug: new Slug(
					`${artist.name} ${album.name} ${extensions.join("-")}`,
				).toString(),
				nameSlug: new Slug(album.name).toString(),
				albumId: album.id,
			},
		});
	};

	const mkSimpleSong = async (
		name: string,
		artist: Artist,
		type: SongType,
		releaseId: number,
		groupId?: number,
		index?: number,
		trackType?: TrackType,
	): Promise<[Song, Track]> => {
		const song = await dummyRepository.song.create({
			data: {
				name,
				slug: new Slug(`${artist.name} ${name}`).toString(),
				artist: { connect: { id: artist.id } },
				type: type ?? SongType.Original,
				nameSlug: new Slug(name).toString(),
				sortName: getSortName(name),
				sortSlug: new Slug(getSortName(name)).toString(),
				group: groupId
					? { connect: { id: groupId } }
					: {
							create: {
								slug: new Slug(
									`${artist.name} ${name}`,
								).toString(),
							},
						},
			},
		});
		const track = await mkSimpleTrack(
			name,
			song.id,
			releaseId,
			index,
			trackType,
		);
		await dummyRepository.song.update({
			where: { id: song.id },
			data: { masterId: track.id },
		});
		song.masterId = track.id;
		return [song, track];
	};

	const mkSimpleTrack = async (
		name: string,
		songId: number,
		releaseId: number,
		index?: number,
		trackType?: TrackType,
	): Promise<Track> => {
		return dummyRepository.track.create({
			data: {
				name,
				song: { connect: { id: songId } },
				release: { connect: { id: releaseId } },
				type: trackType ?? TrackType.Audio,
				trackIndex: index,
				sourceFile: {
					create: {
						path: `${name}-${songId}-${releaseId}`,
						checksum: "",
						registerDate: new Date(),
						library: {
							connect: { id: dummyRepository.library2.id },
						},
					},
				},
			},
		});
	};

	it("Through singles", async () => {
		const artist = await mkSimpleArtist("Siobhan Donaghy");
		const [album] = await mkSimpleAlbum(
			"Ghosts",
			[],
			AlbumType.StudioRecording,
			artist,
		);
		const [single1] = await mkSimpleAlbum(
			"Don't Give It Up - Single",
			[],
			AlbumType.Single,
			artist,
		);

		const [single2] = await mkSimpleAlbum(
			"So You Say - Single",
			[],
			AlbumType.Single,
			artist,
		);

		const albumSongs = (
			await Promise.all(
				["Don't Give It Up", "So You Say", "Ghosts", "Goldfish"].map(
					(s) =>
						mkSimpleSong(
							s,
							artist,
							SongType.Original,
							album.masterId!,
						),
				),
			)
		).map((s) => s[0]);
		const single1Songs = await Promise.all([
			mkSimpleSong(
				"Givin' In",
				artist,
				SongType.Original,
				single1.masterId!,
				undefined,
				2,
			),

			mkSimpleSong(
				"Don't Give It Up (Remix)",
				artist,
				SongType.Remix,
				single1.masterId!,
				albumSongs[0].groupId,
				3,
			),
		]);
		single1Songs.push([
			albumSongs[0],
			await mkSimpleTrack(
				albumSongs[0].name,
				albumSongs[0].id,
				single1.masterId!,
				1,
			),
		]);

		const single2Songs = await Promise.all([
			mkSimpleSong(
				"Dont Take Me Back",
				artist,
				SongType.Original,
				single2.masterId!,
				undefined,
				2,
			),

			mkSimpleSong(
				"Don't Give It Up (Other Remix)",
				artist,
				SongType.Remix,
				single2.masterId!,
				albumSongs[0].groupId,
				3,
			),

			mkSimpleSong(
				"So you say (Acoustic)",
				artist,
				SongType.Acoustic,
				single2.masterId!,
				albumSongs[0].groupId,
				4,
			),
		]);
		single2Songs.push([
			albumSongs[1],
			await mkSimpleTrack(
				albumSongs[1].name,
				albumSongs[1].id,
				single2.masterId!,
				1,
			),
		]);

		const bsides = await songService.getReleaseBSides(
			{
				id: album.masterId!,
			},
			{},
			{},
			{ sortBy: "id" },
		);
		expect(bsides.length).toBe(2);
		expect(bsides[0].id).toBe(single1Songs[0][0].id);
		expect(bsides[1].id).toBe(single2Songs[0][0].id);
	});

	it("Through related video album", async () => {
		const artist = await mkSimpleArtist("Britney Spears");
		const [mainAlbum] = await mkSimpleAlbum(
			"In The Zone",
			[],
			AlbumType.StudioRecording,
			artist,
		);

		const [videoAlbum] = await mkSimpleAlbum(
			"In The Zone DVD",
			[],
			AlbumType.VideoAlbum,
			artist,
		);

		const albumSongs = (
			await Promise.all(
				["Me Against the Music", "Toxic", "Shadow", "Everytime"].map(
					(s) =>
						mkSimpleSong(
							s,
							artist,
							SongType.Original,
							mainAlbum.masterId!,
						),
				),
			)
		).map((s) => s[0]);

		const videoAlbumSongs = (
			await Promise.all([
				mkSimpleSong(
					"I've Just Begun Having My Fun",
					artist,
					SongType.Original,
					videoAlbum.masterId!,
				),
				mkSimpleSong(
					"Toxic (Remix)",
					artist,
					SongType.Remix,
					videoAlbum.masterId!,
					albumSongs[1].groupId,
				),
			])
		).map((s) => s[0]);

		const bsides = await songService.getReleaseBSides(
			{
				id: mainAlbum.masterId!,
			},
			{},
			{},
			{ sortBy: "id" },
		);
		expect(bsides.length).toBe(1);
		expect(bsides[0].id).toBe(videoAlbumSongs[0].id);
	});

	it("Through related releases", async () => {
		const artist = await mkSimpleArtist("Madonna");
		const [mainAlbum] = await mkSimpleAlbum(
			"Music",
			[],
			AlbumType.StudioRecording,
			artist,
		);
		const secondRelease = await mkSimpleRelease(mainAlbum, artist, [
			"Bonus Track Edition",
		]);

		const albumSongs = (
			await Promise.all(
				[
					"Music",
					"Impressive Instant",
					"Don't Tell Me",
					"American Pie",
				].map((s) =>
					mkSimpleSong(
						s,
						artist,
						SongType.Original,
						mainAlbum.masterId!,
					),
				),
			)
		).map((s) => s[0]);

		const bonusSong = await mkSimpleSong(
			"Cyber-Raga",
			artist,
			SongType.Original,
			secondRelease.id,
		);
		await mkSimpleTrack("American Pie", albumSongs[3].id, secondRelease.id);
		await mkSimpleSong(
			"Music (Remix)",
			artist,
			SongType.Remix,
			secondRelease.id,
		);

		const bsides = await songService.getReleaseBSides(
			{
				id: mainAlbum.masterId!,
			},
			{},
			{},
			{ sortBy: "id" },
		);
		expect(bsides.length).toBe(1);
		expect(bsides[0].id).toBe(bonusSong[0].id);
	});

	it("Through single (standalone acoustic song)", async () => {
		const artist = await mkSimpleArtist("Sophie Ellis-Bextor");
		const [album] = await mkSimpleAlbum(
			"Read My Lips",
			[],
			AlbumType.StudioRecording,
			artist,
		);

		const [single] = await mkSimpleAlbum(
			"Get Over You - Single",
			[],
			AlbumType.Single,
			artist,
		);

		const [albumSong] = await mkSimpleSong(
			"Get Over You",
			artist,
			SongType.Original,
			album.masterId!,
		);

		const singleSongs = (
			await Promise.all([
				mkSimpleSong(
					"Live It Up (Acoustic Version)",
					artist,
					SongType.Acoustic,
					single.masterId!,
				),

				mkSimpleSong(
					"Get Over You (Acoustic Version)",
					artist,
					SongType.Acoustic,
					single.masterId!,
					albumSong.groupId,
				),
			])
		).map((s) => s[0]);

		const bsides = await songService.getReleaseBSides(
			{
				id: album.masterId!,
			},
			{},
			{},
			{ sortBy: "id" },
		);
		expect(bsides.length).toBe(1);
		expect(bsides[0].id).toBe(singleSongs[0].id);
	});

	it("Ignore B-Sides when a single is shared across albums", async () => {
		const artist = await mkSimpleArtist("Rachel Stevens");
		const [album1] = await mkSimpleAlbum(
			"Funky Dory",
			[],
			AlbumType.StudioRecording,
			artist,
			new Date(2003),
		);
		const album1Release2 = await mkSimpleRelease(album1, artist, [
			"Special Edition",
		]);
		const [album2] = await mkSimpleAlbum(
			"Come And Get It",
			[],
			AlbumType.StudioRecording,
			artist,
			new Date(2005),
		);

		const [sharedSingle] = await mkSimpleAlbum(
			"Some Girls - Single",
			[],
			AlbumType.Single,
			artist,
		);

		const album1Release1Songs = (
			await Promise.all(
				["Sweet Dreams", "Funky Dory", "Blue Afternoon", "Silk"].map(
					(name) =>
						mkSimpleSong(
							name,
							artist,
							SongType.Original,
							album1.masterId!,
						),
				),
			)
		).map((s) => s[0]);

		// Album 1's second release has all the tracks from release 1 + 2 bonus tracks
		const album1Release2Songs = (
			await Promise.all(
				["Some Girls", "More More More"].map((name) =>
					mkSimpleSong(
						name,
						artist,
						SongType.Original,
						album1Release2.id,
					),
				),
			)
		).map((s) => s[0]);
		await Promise.all(
			album1Release1Songs.map((s) =>
				mkSimpleTrack(s.name, s.id, album1Release2.id),
			),
		);

		// Album 2's songs + track linking album 1 and 2 together
		await Promise.all(
			["So Good", "All About Me", "Funny How"].map((name) =>
				mkSimpleSong(name, artist, SongType.Original, album2.masterId!),
			),
		);
		await mkSimpleTrack(
			"Some Girls",
			album1Release2Songs[0].id,
			album2.masterId!,
		);

		const singleSongs = await Promise.all([
			mkSimpleSong(
				"Spin the Bottle",
				artist,
				SongType.Original,
				sharedSingle.masterId!,
			),

			mkSimpleSong(
				"Some Girls (Remix)",
				artist,
				SongType.Remix,
				sharedSingle.masterId!,
				album1Release2Songs[0].groupId,
			),
		]);

		// Album 1-Release 1 has 2 bsides: the exclusive ones from release2 (not what we test here)
		const bsidesRelease1Ids = (
			await songService.getReleaseBSides({
				id: album1.masterId!,
			})
		).map(({ id }) => id);
		expect(bsidesRelease1Ids.length).toBe(2);
		expect(bsidesRelease1Ids).toContain(album1Release2Songs[0].id);
		expect(bsidesRelease1Ids).toContain(album1Release2Songs[1].id);

		// Album 1-Release 2 has 1 bsides: the exclusive track from the single
		const bsidesRelease2 = await songService.getReleaseBSides({
			id: album1Release2.id,
		});
		expect(bsidesRelease2.length).toBe(1);
		expect(bsidesRelease2[0].id).toBe(singleSongs[0][0].id);

		// Album 2 does not list the single's bside because there is an older album with that single
		expect(
			await songService.getReleaseBSides({ id: album2.masterId! }),
		).toEqual([]);
	});
});
