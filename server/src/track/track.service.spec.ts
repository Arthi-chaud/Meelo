import type { TestingModule } from "@nestjs/testing";
import { RipSource, TrackType } from "src/prisma/generated/client";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import { FileNotFoundException } from "src/file/file.exceptions";
import FileModule from "src/file/file.module";
import FileService from "src/file/file.service";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import LibraryModule from "src/library/library.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ParserModule from "src/parser/parser.module";
import type { File, Library, Track } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { ReleaseNotFoundException } from "src/release/release.exceptions";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import Slug from "src/slug/slug";
import { SongNotFoundException } from "src/song/song.exceptions";
import SongModule from "src/song/song.module";
import SongService from "src/song/song.service";
import { StreamModule } from "src/stream/stream.module";
import VideoModule from "src/video/video.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	MasterTrackNotFoundException,
	TrackAlreadyExistsException,
	TrackNotFoundException,
} from "./track.exceptions";
import TrackModule from "./track.module";
import TrackService from "./track.service";

describe("Track Service", () => {
	let trackService: TrackService;
	let releaseService: ReleaseService;
	let dummyRepository: TestPrismaService;
	let songService: SongService;

	let file: File;
	let file2: File;
	let tmpFile: File;
	let newTrack: Track;
	let newTrack2: Track;

	let secondLibrary: Library;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				FileModule,
				ParserModule,
				IllustrationModule,
				TrackModule,
				ArtistModule,
				SongModule,
				AlbumModule,
				ReleaseModule,
				FileManagerModule,
				SettingsModule,
				GenreModule,
				LyricsModule,
				LibraryModule,
				VideoModule,
				StreamModule,
			],
			providers: [
				PrismaService,
				TrackService,
				ArtistService,
				SongService,
				AlbumService,
				ReleaseService,
				FileService,
				FileManagerService,
				SettingsService,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		trackService = module.get<TrackService>(TrackService);
		dummyRepository = module.get(PrismaService);
		songService = module.get<SongService>(SongService);
		releaseService = module.get(ReleaseService);

		const fileService = module.get<FileService>(FileService);
		const prismaService = module.get<PrismaService>(PrismaService);
		secondLibrary = await prismaService.library.create({
			data: {
				name: "b",
				slug: "b",
				path: "b",
			},
		});
		file = await fileService.create({
			path: "My Artist/My Album/1-02 My dummyRepository.songA1.m4a",
			libraryId: dummyRepository.library1.id,
			registerDate: new Date(),
			checksum: "",
			fingerprint: null,
		});
		file2 = await fileService.create({
			path: "My Artist/My Album (Special Edition)/1-02 My dummyRepository.songA1.m4a",
			libraryId: secondLibrary.id,
			registerDate: new Date(),
			checksum: "",
			fingerprint: null,
		});
		tmpFile = await fileService.create({
			path: "My Artist/My Album (Special Edition)/2-01 My dummyRepository.songA1 video.m4a",
			libraryId: secondLibrary.id,
			registerDate: new Date(),
			checksum: "",
			fingerprint: null,
		});
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(trackService).toBeDefined();
	});

	const trackData = {
		mixed: false,
		type: TrackType.Audio,
		name: "",
		discName: null,
		discIndex: 1,
		trackIndex: 2,
		bitrate: 320,
		ripSource: RipSource.CD,
		duration: 180,
	};

	describe("Create a Track", () => {
		it("should create a track", async () => {
			newTrack = await trackService.create({
				...trackData,
				isBonus: false,
				isRemastered: false,
				name: "My Song 3",
				song: { id: dummyRepository.songA1.id },
				release: { id: dummyRepository.releaseA1_2.id },
				sourceFile: { id: file.id },
			});

			expect(newTrack.id).toBeDefined();
			expect(newTrack.type).toBe(TrackType.Audio);
			expect(newTrack.name).toBe("My Song 3");
			expect(newTrack.discIndex).toBe(1);
			expect(newTrack.trackIndex).toBe(2);
			expect(newTrack.bitrate).toBe(320);
			expect(newTrack.ripSource).toBe(RipSource.CD);
			expect(newTrack.duration).toBe(180);
			expect(newTrack.songId).toBe(dummyRepository.songA1.id);
			expect(newTrack.releaseId).toBe(dummyRepository.releaseA1_2.id);
			expect(newTrack.sourceFileId).toBe(file.id);
		});

		it("should create a second track", async () => {
			newTrack2 = await trackService.create({
				...trackData,
				isBonus: false,
				isRemastered: false,
				type: TrackType.Video,
				name: "My Song 4",
				song: { id: dummyRepository.songA1.id },
				release: { id: dummyRepository.releaseA1_2.id },
				sourceFile: { id: file2.id },
			});

			expect(newTrack2.id).toBeDefined();
			expect(newTrack2.type).toBe(TrackType.Video);
			expect(newTrack2.name).toBe("My Song 4");
			expect(newTrack2.discIndex).toBe(1);
			expect(newTrack2.trackIndex).toBe(2);
			expect(newTrack2.bitrate).toBe(320);
			expect(newTrack2.ripSource).toBe(RipSource.CD);
			expect(newTrack2.duration).toBe(180);
			expect(newTrack2.songId).toBe(dummyRepository.songA1.id);
			expect(newTrack2.releaseId).toBe(dummyRepository.releaseA1_2.id);
			expect(newTrack2.sourceFileId).toBe(file2.id);
		});

		it("should throw, as the source file does not exist", async () => {
			const test = async () =>
				await trackService.create({
					...trackData,
					isBonus: false,
					isRemastered: false,
					song: { id: dummyRepository.songA1.id },
					release: { id: dummyRepository.releaseA1_1.id },
					sourceFile: { id: -1 },
				});
			return expect(test()).rejects.toThrow(FileNotFoundException);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = async () =>
				await trackService.create({
					...trackData,
					song: { id: -1 },
					isRemastered: false,
					isBonus: false,
					release: { id: dummyRepository.releaseA1_1.id },
					sourceFile: { id: file.id },
				});
			return expect(test()).rejects.toThrow(SongNotFoundException);
		});

		it("should throw, as the parent release does not exist", async () => {
			const test = async () =>
				await trackService.create({
					...trackData,
					isBonus: false,
					isRemastered: false,
					song: { id: dummyRepository.songA1.id },
					release: { id: -1 },
					sourceFile: { id: file.id },
				});
			return expect(test()).rejects.toThrow(ReleaseNotFoundException);
		});

		it("should throw, as the track already exists", async () => {
			const test = async () =>
				await trackService.create({
					...trackData,
					isBonus: false,
					isRemastered: false,
					song: { id: dummyRepository.songA1.id },
					release: { id: dummyRepository.releaseA1_1.id },
					sourceFile: { id: file.id },
				});

			return expect(test()).rejects.toThrow(TrackAlreadyExistsException);
		});
	});

	describe("Get a Track", () => {
		it("should retrieve the track (by id)", async () => {
			const retrievedTrack = await trackService.get({
				id: dummyRepository.trackA1_1.id,
			});

			expect(retrievedTrack).toStrictEqual(dummyRepository.trackA1_1);
		});

		it("should retrieve the track (by source file)", async () => {
			const retrievedTrack = await trackService.get({
				sourceFile: { id: dummyRepository.fileA1_1.id },
			});

			expect(retrievedTrack).toStrictEqual(dummyRepository.trackA1_1);
		});

		it("should throw, as the track does not exist (by id)", async () => {
			const test = async () => await trackService.get({ id: -1 });

			return expect(test()).rejects.toThrow(TrackNotFoundException);
		});

		it("should throw, as the file does not exist", async () => {
			const test = async () =>
				await trackService.get({
					sourceFile: { id: -1 },
				});

			return expect(test()).rejects.toThrow(FileNotFoundException);
		});
	});

	describe("Get Tracks", () => {
		it("should retrieve all tracks", async () => {
			const tracks = await trackService.getMany({});

			expect(tracks).toContainEqual(newTrack2);
			expect(tracks).toContainEqual(newTrack);
			expect(tracks).toContainEqual(dummyRepository.trackA1_1);
			expect(tracks).toContainEqual(dummyRepository.trackA2_1);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
			expect(tracks).toContainEqual(dummyRepository.trackB1_1);
			expect(tracks).toContainEqual(dummyRepository.trackC1_1);
			expect(tracks.length).toBe(7);
		});

		it("should retrieve all video tracks", async () => {
			const tracks = await trackService.getMany(
				{ type: TrackType.Video },
				{},
				{},
			);

			expect(tracks.length).toBe(2);
			expect(tracks).toContainEqual(newTrack2);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
		});
		it("should retrieve all tracks, sorted by name", async () => {
			const tracks = await trackService.getMany(
				{},
				{ sortBy: "name", order: "asc" },
				{},
				{},
			);

			expect(tracks.length).toBe(7);
			expect(tracks[0]).toStrictEqual(dummyRepository.trackC1_1);
			expect(tracks[1]).toStrictEqual(dummyRepository.trackA2_1);
			expect(tracks[2]).toStrictEqual(dummyRepository.trackB1_1);
			expect(tracks[3]).toStrictEqual(dummyRepository.trackA1_1);
			expect(tracks[4]).toStrictEqual(dummyRepository.trackA1_2Video);
			expect(tracks[5]).toStrictEqual(newTrack);
			expect(tracks[6]).toStrictEqual(newTrack2);
		});
		it("should retrieve the tracks by libraries (4 expected)", async () => {
			const tracks = await trackService.getMany({
				library: { is: { id: dummyRepository.library1.id } },
			});

			expect(tracks).toContainEqual(newTrack);
			expect(tracks).toContainEqual(dummyRepository.trackA1_1);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
			expect(tracks).toContainEqual(dummyRepository.trackC1_1);
			expect(tracks.length).toBe(4);
		});

		it("should retrieve the tracks by libraries (1 expected)", async () => {
			const tracks = await trackService.getMany({
				library: { is: { id: secondLibrary.id } },
			});

			expect(tracks.length).toBe(1);
			expect(tracks).toContainEqual(newTrack2);
		});

		it("should retrieve the tracks by song (w/ pagination)", async () => {
			const tracks = await trackService.getMany(
				{ song: { is: { id: dummyRepository.songA1.id } } },
				{ sortBy: "name", order: "asc" },
				{ take: 1, skip: 1 },
				{},
			);

			expect(tracks.length).toBe(1);
			expect(tracks[0]).toStrictEqual(dummyRepository.trackA1_2Video);
		});

		it("should retrieve the tracks by song (w/ pagination, volume 2)", async () => {
			const tracks = await trackService.getMany(
				{ song: { is: { id: dummyRepository.songA1.id } } },
				{ sortBy: "name", order: "asc" },
				{ take: 2, skip: 2 },
				{},
			);
			expect(tracks.length).toBe(2);
			expect(tracks[0]).toStrictEqual(newTrack);
			expect(tracks[1]).toStrictEqual(newTrack2);
		});
	});

	describe("Get a Song's Tracks", () => {
		it("should retrieve the song's tracks", async () => {
			const tracks = await trackService.getMany({
				song: {
					is: { id: dummyRepository.songA1.id },
				},
			});

			expect(tracks.length).toBe(4);
			expect(tracks).toContainEqual(newTrack);
			expect(tracks).toContainEqual(newTrack2);
			expect(tracks).toContainEqual(dummyRepository.trackA1_1);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
		});
	});

	describe("Get a Song's Master Track", () => {
		it("should retrieve the song's master track", async () => {
			const tmpRelease = await releaseService.create({
				album: {
					id: dummyRepository.albumA1.id,
				},
				extensions: [],
				name: "tmp",
				releaseDate: new Date("2001"),
			});
			const tmpTrack = await trackService.create({
				type: TrackType.Video,
				isBonus: false,
				isRemastered: false,
				name: "",
				mixed: true,
				discName: null,
				discIndex: 1,
				trackIndex: 2,
				bitrate: 320,
				ripSource: RipSource.CD,
				duration: 180,
				sourceFile: { id: tmpFile.id },
				release: {
					id: tmpRelease.id,
				},
				song: { id: dummyRepository.songA1.id },
			});
			const track = await trackService.getSongMasterTrack({
				id: dummyRepository.songA1.id,
			});
			await trackService.delete([{ id: tmpTrack.id }]);
			await releaseService.delete([{ id: tmpRelease.id }]);
			expect(track).toStrictEqual(dummyRepository.trackA1_1);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = async () =>
				await trackService.getSongMasterTrack({ id: -1 });
			return expect(test()).rejects.toThrow(SongNotFoundException);
		});
		it("should throw, as the parent song does not have tracks", async () => {
			const tmpSong = await songService.create({
				name: "A",
				artist: { id: dummyRepository.artistB.id },
				genres: [],
				group: {
					slug: new Slug(dummyRepository.artistB.name, "a"),
				},
			});
			const test = async () =>
				await trackService.getSongMasterTrack({ id: tmpSong.id });
			return expect(test()).rejects.toThrow(MasterTrackNotFoundException);
		});
	});

	describe("Update Track", () => {
		it("should update the track's name", async () => {
			const newTitle = "My Song 3 (2008 Version)";
			const updatedTrack = await trackService.update(
				{ name: newTitle },
				{ id: newTrack.id },
			);

			expect(updatedTrack).toStrictEqual({ ...newTrack, name: newTitle });
			newTrack = updatedTrack;
		});

		it("should reassign the track's song", async () => {
			const updatedTrack = await trackService.update(
				{
					song: { id: dummyRepository.songA1.id },
				},
				{ id: dummyRepository.trackA2_1.id },
			);
			expect(updatedTrack).toStrictEqual({
				...dummyRepository.trackA2_1,
				songId: dummyRepository.songA1.id,
			});
			// housekeeping would have deleted the song
			expect(() =>
				trackService.update(
					{
						song: { id: dummyRepository.songA2.id },
					},
					{ id: dummyRepository.trackA2_1.id },
				),
			).rejects.toThrow(SongNotFoundException);
		});

		it("should throw, as the track does not exist", async () => {
			const test = async () => await trackService.update({}, { id: -1 });
			return expect(test()).rejects.toThrow(TrackNotFoundException);
		});
	});

	describe("Delete Track", () => {
		it("should delete the track", async () => {
			await songService.update(
				{
					master: { id: dummyRepository.trackA1_1.id },
				},
				{ id: dummyRepository.songA1.id },
			);
			await trackService.delete([{ id: dummyRepository.trackA1_1.id }]);

			const test = async () =>
				await trackService.get({ id: dummyRepository.trackA1_1.id });
			return expect(test()).rejects.toThrow(TrackNotFoundException);
		});

		it("should have unset of the song", async () => {
			const song = await songService.get({
				id: dummyRepository.songA1.id,
			});
			expect(song.masterId).toBeNull();
		});

		it("should throw, as the track does not exists", async () => {
			const test = async () => await trackService.get({ id: -1 });
			return expect(test()).rejects.toThrow(TrackNotFoundException);
		});
	});
});
