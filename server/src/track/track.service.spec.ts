import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import {  TrackType, RipSource } from "@prisma/client";
import { File, Library, Track } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerModule from "src/file-manager/file-manager.module";
import { FileNotFoundFromIDException } from "src/file/file.exceptions";
import FileModule from "src/file/file.module";
import FileService from "src/file/file.service";
import IllustrationModule from "src/illustration/illustration.module";
import MetadataModule from "src/metadata/metadata.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import { ReleaseNotFoundFromIDException } from "src/release/release.exceptions";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import { SongNotFoundByIdException } from "src/song/song.exceptions";
import SongModule from "src/song/song.module";
import SongService from "src/song/song.service";
import { MasterTrackNotFoundException, TrackAlreadyExistsException, TrackNotFoundByIdException } from "./track.exceptions";
import TrackModule from "./track.module";
import TrackService from "./track.service";
import { ArtistNotFoundByIDException } from "src/artist/artist.exceptions";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import { LyricsModule } from "src/lyrics/lyrics.module";
import LibraryModule from "src/library/library.module";
import FileManagerService from "src/file-manager/file-manager.service";
import ArtistIllustrationService from "src/artist/artist-illustration.service";

describe('Track Service', () => {
	let trackService: TrackService;
	let dummyRepository: TestPrismaService;
	let artistService: ArtistService;
	let songService: SongService;

	let file: File;
	let file2: File;
	let newTrack: Track;
	let newTrack2: Track;

	let secondLibrary: Library;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, FileModule, MetadataModule, IllustrationModule,TrackModule, ArtistModule, SongModule, AlbumModule, ReleaseModule, FileManagerModule, SettingsModule, GenreModule, LyricsModule, LibraryModule],
			providers: [PrismaService,TrackService, ArtistService, SongService, AlbumService, ReleaseService, FileService, FileManagerService, SettingsService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		trackService = module.get<TrackService>(TrackService);
		dummyRepository = module.get(PrismaService);
		artistService = module.get<ArtistService>(ArtistService);
		songService = module.get<SongService>(SongService);
		module.get(ArtistIllustrationService).onModuleInit();
		const fileService = module.get<FileService>(FileService);
		const prismaService = module.get<PrismaService>(PrismaService);
		secondLibrary = await prismaService.library.create({
			data: {
				name: "b",
				slug: "b",
				path: "b"
			}
		});
		file = await fileService.create({
			path: "My Artist/My Album/1-02 My dummyRepository.songA1.m4a",
			libraryId: dummyRepository.library1.id,
			registerDate: new Date(),
			md5Checksum: ''
		});
		file2 = await fileService.create({
			path: "My Artist/My Album (Special Edition)/1-02 My dummyRepository.songA1.m4a",
			libraryId: secondLibrary.id,
			registerDate: new Date(),
			md5Checksum: ''
		});

	});

	it('should be defined', () => {
		expect(trackService).toBeDefined();
	});

	const trackData = {
		type: TrackType.Audio,
		name: '',
		discIndex: 1,
		trackIndex: 2,
		bitrate: 320,
		ripSource: RipSource.CD,
		duration: 180,
	}

	describe("Create a Track", () => {
		it("should create a track", async () => {
			newTrack = await trackService.create({
				...trackData,
				name: 'My Song 3',
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
				type: TrackType.Video,
				name: 'My Song 4',
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
			const test = async () => await trackService.create({
				...trackData,
				song: { id: dummyRepository.songA1.id },
				release: { id: dummyRepository.releaseA1_1.id },
				sourceFile: { id: -1 },
			});
			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = async () => await trackService.create({
				...trackData,
				song: { id: -1 },
				release: { id: dummyRepository.releaseA1_1.id },
				sourceFile: { id: file.id },
			});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the parent release does not exist", async () => {
			const test = async () => await trackService.create({
				...trackData,
				song: { id: dummyRepository.songA1.id },
				release: { id: -1 },
				sourceFile: { id: file.id },
			});
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});

		it("should throw, as the track already exists", async () => {
			const test = async () => await trackService.create({
				...trackData,
				song: { id: dummyRepository.songA1.id },
				release: { id: dummyRepository.releaseA1_1.id },
				sourceFile: { id: file.id },
			});

			expect(test()).rejects.toThrow(TrackAlreadyExistsException);
		});
	});

	describe("Get a Track", () => {
		it("should retrieve the track (by id)", async () => {
			const retrievedTrack = await trackService.get({ id: dummyRepository.trackA1_1.id });

			expect(retrievedTrack).toStrictEqual(dummyRepository.trackA1_1);
		});

		it("should retrieve the track (by source file)", async () => {
			const retrievedTrack = await trackService.get({
				sourceFile: { id: dummyRepository.fileA1_1.id }
			});

			expect(retrievedTrack).toStrictEqual(dummyRepository.trackA1_1);
		});

		it(('should return an existing track, without only its id and duration'), async () => {
			const track = await trackService.select({ id: dummyRepository.trackC1_1.id }, { duration: true, id: true });
			expect(track).toStrictEqual({ id: dummyRepository.trackC1_1.id, duration: dummyRepository.trackC1_1.duration});
		});

		it("should throw, as the track does not exist (on select)", async () => {
			const test = async () => await trackService.select({ id: -1 }, { id: true });

			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should throw, as the track does not exist (by id)", async () => {
			const test = async () => await trackService.get({id: -1});

			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should throw, as the file does not exist", async () => {
			const test = async () => await trackService.get({
				sourceFile: { id: -1 }
			});

			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});
	});

	describe("Get Tracks", () => {
		it('should retrieve all tracks', async () => {
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
		it('should retrieve all video tracks', async () => {
			const tracks = await trackService.getMany({ type: TrackType.Video }, {}, {});

			expect(tracks.length).toBe(2);
			expect(tracks).toContainEqual(newTrack2);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
		});
		it('should retrieve all tracks, sorted by name', async () => {
			const tracks = await trackService.getMany({}, {}, {}, { sortBy: 'name', order: 'asc' });

			expect(tracks.length).toBe(7);
			expect(tracks[0]).toStrictEqual(dummyRepository.trackC1_1);
			expect(tracks[1]).toStrictEqual(dummyRepository.trackA2_1);
			expect(tracks[2]).toStrictEqual(dummyRepository.trackB1_1);
			expect(tracks[3]).toStrictEqual(dummyRepository.trackA1_1);
			expect(tracks[4]).toStrictEqual(dummyRepository.trackA1_2Video);
			expect(tracks[5]).toStrictEqual(newTrack);
			expect(tracks[6]).toStrictEqual(newTrack2);
		});
		it('should retrieve the tracks by libraries (5 expected)', async () => {
			const tracks = await trackService.getMany({ library: { id: dummyRepository.library1.id } });


			expect(tracks).toContainEqual(newTrack);
			expect(tracks).toContainEqual(dummyRepository.trackA1_1);
			expect(tracks).toContainEqual(dummyRepository.trackA2_1);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
			expect(tracks).toContainEqual(dummyRepository.trackC1_1);
			expect(tracks.length).toBe(5);
		});

		it('should retrieve the tracks by libraries (1 expected)', async () => {
			const tracks = await trackService.getMany({ library: { id: secondLibrary.id } });

			expect(tracks.length).toBe(1);
			expect(tracks).toContainEqual(newTrack2);
		});

		it('should retrieve the tracks by song (w/ pagination)', async () => {
			const tracks = await trackService.getMany(
				{ song: { id: dummyRepository.songA1.id } },
				{ take: 1, skip: 1 }, {}, { sortBy: 'name', order: 'asc' }
			);

			expect(tracks.length).toBe(1);
			expect(tracks[0]).toStrictEqual(dummyRepository.trackA1_2Video);
		});

		it('should retrieve the tracks by song (w/ pagination, volume 2)', async () => {
			const tracks = await trackService.getMany(
				{ song: { id: dummyRepository.songA1.id } },
				{ take: 2, skip: 2 }, {}, { sortBy: 'name', order: 'asc' }
			);
			expect(tracks.length).toBe(2);
			expect(tracks[0]).toStrictEqual(newTrack);
			expect(tracks[1]).toStrictEqual(newTrack2);
		});
	});

	describe("Get a Song's Tracks", () => {
		it('should retrieve the song\'s tracks', async () => {
			const tracks = await trackService.getSongTracks({ id: dummyRepository.songA1.id });

			expect(tracks.length).toBe(4);
			expect(tracks).toContainEqual(newTrack);
			expect(tracks).toContainEqual(newTrack2);
			expect(tracks).toContainEqual(dummyRepository.trackA1_1);
			expect(tracks).toContainEqual(dummyRepository.trackA1_2Video);
		});

		it('should throw, as the parent song does not exist', async () => {
			const test = async () => await trackService.getSongTracks({ id: -1 });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
	});

	describe("Get a Song's Master Track", () => {
		it('should retrieve the song\'s master track', async () => {
			const track = await trackService.getMasterTrack({ id: dummyRepository.songA1.id });

			expect(track).toStrictEqual(dummyRepository.trackA1_1);
		});

		it('should throw, as the parent song does not exist', async () => {
			const test = async () => await trackService.getMasterTrack({ id: -1 });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
		it('should throw, as the parent song does not have tracks', async () => {
			const tmpSong = await songService.create({
				name: 'A', artist: { id: dummyRepository.artistB.id },
				genres: []
			});
			const test = async () => await trackService.getMasterTrack({ id: tmpSong.id });
			expect(test()).rejects.toThrow(MasterTrackNotFoundException);
		});
	});

	describe("Count Tracks", () => {
		it("should count the artist's tracks", async () => {
			const trackCount = await trackService.count({ artist: { id: dummyRepository.artistA.id } });
			expect(trackCount).toBe(5);
		});

		it("should count the album's tracks", async () => {
			const trackCount = await trackService.count({ album: { id: dummyRepository.albumA1.id } });
			expect(trackCount).toBe(5);
		});

		it("should count the song's tracks", async () => {
			const trackCount = await trackService.count({ song: { id: dummyRepository.songA2.id } });
			expect(trackCount).toBe(1);
		});

		it("should count all the tracks", async () => {
			const trackCount = await trackService.count({ });
			expect(trackCount).toBe(7);
		});
	});

	describe("Update Track", () => {
		it("should update the track's name", async () => {
			const newTitle = "My Song 3 (2008 Version)";
			const updatedTrack = await trackService.update(
				{ name: newTitle },
				{ id: newTrack.id }
			);

			expect(updatedTrack).toStrictEqual({...newTrack, name: newTitle });
			newTrack = updatedTrack;
		});

		it("should reassign the track's song", async () => {
			let updatedTrack = await trackService.update({
				song: { id: dummyRepository.songA1.id }}, { id: dummyRepository.trackA2_1.id } );
			expect(updatedTrack).toStrictEqual({ ...dummyRepository.trackA2_1, songId: dummyRepository.songA1.id})
			updatedTrack = await trackService.update({
				song: { id: dummyRepository.songA2.id }}, { id: dummyRepository.trackA2_1.id } );
			expect(updatedTrack).toStrictEqual({ ...dummyRepository.trackA2_1, songId: dummyRepository.songA2.id})
		});

		it("should throw, as the track does not exist", async () => {
			const test = async () => await trackService.update({}, { id: -1 });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});
	});

	describe("Reassign track", () => {
		it("should reassign the track's parent song", async () => {
			await trackService.reassign(
				{ id: dummyRepository.trackC1_1.id },
				{ id: dummyRepository.songB1.id }
			);
			const updatedTrack = await trackService.get({ id: dummyRepository.trackC1_1.id });
			expect(updatedTrack.songId).toBe(dummyRepository.songB1.id);
		});

		it("should have deleted previous, now empty, parent song", () => {
			const test = async () => await songService.get({ id: dummyRepository.songC1.id });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should reassign the master track", async () => {
			await trackService.reassign(
				{ id: dummyRepository.trackB1_1.id },
				{ id: dummyRepository.songA2.id }
			);
			const updatedTrack = await trackService.get({ id: dummyRepository.trackB1_1.id });
			expect(updatedTrack.songId).toBe(dummyRepository.songA2.id);

			/// teardown
			trackService.delete({ id: dummyRepository.trackB1_1.id })
		});
	});

	describe("Delete Track", () => {
		it("should delete the master track", async () => {
			await trackService.delete({ id:  dummyRepository.trackA1_1.id });

			const test = async () => await trackService.get({ id: dummyRepository.trackA1_1.id });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should have changed the master track of the song", async () => {
			await trackService.getMasterTrack({ id: dummyRepository.songA1.id });
		});

		it("should delete the other tracks of the song (first song)", async () => {
			await trackService.delete({ id: dummyRepository.trackA1_2Video.id });
			await trackService.delete({ id: newTrack.id });
			await trackService.delete({ id: newTrack2.id });

			const testMaster = async () => await trackService.get({ id: dummyRepository.trackA1_2Video.id });
			expect(testMaster()).rejects.toThrow(TrackNotFoundByIdException);
			const testNew1 = async () => await trackService.get({ id: newTrack.id });
			expect(testNew1()).rejects.toThrow(TrackNotFoundByIdException);
			const testNew2 = async () => await trackService.get({ id: newTrack2.id });
			expect(testNew2()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should delete the last song's track (second song)", async () => {
			await trackService.delete({ id: dummyRepository.trackA2_1.id });

			const test = async () => await trackService.get({ id: dummyRepository.trackA2_1.id });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should have delete the parent song", async () => {
			const test = async () => await songService.get({ id: dummyRepository.songA2.id});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should have delete the parent artist", async () => {
			const test = async () => await artistService.get({ id: dummyRepository.artistA.id  });
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});

		it("should throw, as the track does not exists", async () => {
			const test = async () => await trackService.get({ id: -1 });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});
	});
});