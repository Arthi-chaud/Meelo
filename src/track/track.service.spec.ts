import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import { Album, Artist, File, Library, Release, RipSource, Song, Track, TrackType } from "@prisma/client";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerModule from "src/file-manager/file-manager.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { FileNotFoundFromIDException } from "src/file/file.exceptions";
import FileModule from "src/file/file.module";
import FileService from "src/file/file.service";
import IllustrationModule from "src/illustration/illustration.module";
import LibraryModule from "src/library/library.module";
import LibraryService from "src/library/library.service";
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
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { TrackAlreadyExistsException, TrackNotFoundByIdException } from "./track.exceptions";
import TrackModule from "./track.module";
import TrackService from "./track.service";
import { ArtistNotFoundByIDException } from "src/artist/artist.exceptions";

describe('Track Service', () => {
	let artistService: ArtistService;
	let songService: SongService;
	let releaseService: ReleaseService;
	let fileService: FileService;
	let trackService: TrackService;
	let albumService: AlbumService;
	let libraryService: LibraryService;

	let song: Song;
	let artist: Artist;
	let file: File;
	let file2: File;
	let release: Release;
	let album: Album;
	let library: Library;
	let track: Track;
	let track2: Track;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, LibraryModule, MetadataModule, IllustrationModule,TrackModule, ArtistModule, SongModule, AlbumModule, ReleaseModule, FileModule, FileManagerModule, SettingsModule],
			providers: [PrismaService, LibraryService,TrackService, ArtistService, SongService, AlbumService, ReleaseService, FileService, FileManagerService, SettingsService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		songService = module.get<SongService>(SongService);
		artistService = module.get<ArtistService>(ArtistService);
		releaseService = module.get<ReleaseService>(ReleaseService);
		fileService = module.get<FileService>(FileService);
		albumService = module.get<AlbumService>(AlbumService);
		trackService = module.get<TrackService>(TrackService);
		libraryService = module.get<LibraryService>(LibraryService);

		library = await libraryService.createLibrary({ name: "Library", path: "Music/" });
		artist = await artistService.createArtist({ name: "My Artist" });
		file = await fileService.createFile({
			path: "My Artist/My Album/1-02 My Song.m4a",
			libraryId: library.id,
			registerDate: new Date(),
			md5Checksum: ''
		});
		file2 = await fileService.createFile({
			path: "My Artist/My Album (Special Edition)/1-02 My Song.m4a",
			libraryId: library.id,
			registerDate: new Date(),
			md5Checksum: ''
		});
		album = await albumService.createAlbum({ name: "My Album", artist: { id: artist.id } });
		song = await songService.createSong({ name: "My Song", artist: { id: artist.id } });
		release = await releaseService.createRelease({
			title: "My Album (Deluxe Edition)",
			master: true,
			album: { byId: { id: album.id } },
		});

	});

	it('should be defined', () => {
		expect(songService).toBeDefined();
		expect(artistService).toBeDefined();
		expect(releaseService).toBeDefined();
		expect(fileService).toBeDefined();
		expect(trackService).toBeDefined();
	});

	const trackData = {
		type: TrackType.Audio,
		master: true,
		displayName: "My Song (Track Edit)",
		discIndex: 1,
		trackIndex: 2,
		bitrate: 320,
		ripSource: RipSource.CD,
		duration: 180,
	}

	describe("Create a Track", () => {
		it("should create a track", async () => {
			track = await trackService.createTrack({
				...trackData,
				song: { byId: { id: song.id } },
				release: { byId: { id: release.id } },
				sourceFile: { id: file.id },
			});

			expect(track.id).toBeDefined();
			expect(track.type).toBe(TrackType.Audio);
			expect(track.master).toBe(true);
			expect(track.displayName).toBe("My Song (Track Edit)");
			expect(track.discIndex).toBe(1);
			expect(track.trackIndex).toBe(2);
			expect(track.bitrate).toBe(320);
			expect(track.ripSource).toBe(RipSource.CD);
			expect(track.duration).toBe(180);
			expect(track.songId).toBe(song.id);
			expect(track.releaseId).toBe(release.id);
			expect(track.sourceFileId).toBe(file.id);
		});

		it("should create a second track", async () => {
			track2 = await trackService.createTrack({
				...trackData,
				master: false,
				displayName: "My Song (Album Edit)",
				song: { byId: { id: song.id } },
				release: { byId: { id: release.id } },
				sourceFile: { id: file2.id },
			});

			expect(track2.id).toBeDefined();
			expect(track2.type).toBe(TrackType.Audio);
			expect(track2.master).toBe(false);
			expect(track2.displayName).toBe("My Song (Album Edit)");
			expect(track2.discIndex).toBe(1);
			expect(track2.trackIndex).toBe(2);
			expect(track2.bitrate).toBe(320);
			expect(track2.ripSource).toBe(RipSource.CD);
			expect(track2.duration).toBe(180);
			expect(track2.songId).toBe(song.id);
			expect(track2.releaseId).toBe(release.id);
			expect(track2.sourceFileId).toBe(file2.id);
		});

		it("should throw, as the source file does not exist", async () => {
			const test = async () => await trackService.createTrack({
				...trackData,
				song: { byId: { id: song.id } },
				release: { byId: { id: release.id } },
				sourceFile: { id: -1 },
			});
			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = async () => await trackService.createTrack({
				...trackData,
				song: { byId: { id: -1 } },
				release: { byId: { id: release.id } },
				sourceFile: { id: file.id },
			});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the parent release does not exist", async () => {
			const test = async () => await trackService.createTrack({
				...trackData,
				song: { byId: { id: song.id } },
				release: { byId: { id: -1 } },
				sourceFile: { id: file.id },
			});
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});

		it("should throw, as the track already exists", async () => {
			const test = async () => await trackService.createTrack({
				...trackData,
				song: { byId: { id: song.id } },
				release: { byId: { id: release.id } },
				sourceFile: { id: file.id },
			});

			expect(test()).rejects.toThrow(TrackAlreadyExistsException);
		});
	});

	describe("Get a Track", () => {
		it("should retrieve the track (by id)", async () => {
			let retrievedTrack = await trackService.getTrack({ id: track.id });

			expect(retrievedTrack).toStrictEqual(track);
		});

		it("should retrieve the track (by source file)", async () => {
			let retrievedTrack = await trackService.getTrack({
				sourceFile: { id: file2.id }
			});

			expect(retrievedTrack).toStrictEqual(track2);
		});

		it("should retrieve the track (by song)", async () => {
			let retrievedTrack = await trackService.getTrack({
				masterOfSong: { byId: { id: song.id } }
			});

			expect(retrievedTrack).toStrictEqual(track);
		});

		it("should throw, as the track does not exist (by id)", async () => {
			const test = async () => await trackService.getTrack({id: -1});

			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should throw, as the parent song does not exist", async () => {
			const test = async () => await trackService.getTrack({
				masterOfSong: { byId: { id: -1 } }
			});

			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should throw, as the file does not exist", async () => {
			const test = async () => await trackService.getTrack({
				sourceFile: { id: -1 }
			});

			expect(test()).rejects.toThrow(FileNotFoundFromIDException);
		});
	});

	describe("Get a Track", () => {
		it('should retrieve all tracks', async () => {
			let tracks = await trackService.getTracks({});

			expect(tracks).toContainEqual(track2);
			expect(tracks).toContainEqual(track);
			expect(tracks.length).toBe(2);
		});
		it('should retrieve the tracks by libraries', async () => {
			let tracks = await trackService.getTracks({ byLibrarySource: { id: library.id } });

			expect(tracks).toContainEqual(track2);
			expect(tracks).toContainEqual(track);
			expect(tracks.length).toBe(2);
		});

		it('should retrieve the tracks by song (w/ pagination)', async () => {
			let tracks = await trackService.getTracks(
				{ bySong: { byId: { id: song.id } } },
				{ take: 1, skip: 1 }
			);

			expect(tracks.length).toBe(1);
			expect(tracks).toStrictEqual([track2]);
		});

		it('should retrieve the tracks by song (w/ pagination, volume 2)', async () => {
			let tracks = await trackService.getTracks(
				{ bySong: { byId: { id: song.id } } },
				{ take: 1, skip: 0 }
			);
			expect(tracks.length).toBe(1);
			expect(tracks).toStrictEqual([track]);
		});
	});

	describe("Get a Song's Tracks", () => {
		it('should retrieve the song\'s tracks', async () => {
			let tracks = await trackService.getSongTracks({ byId: { id: song.id } });

			expect(tracks).toContainEqual(track2);
			expect(tracks).toContainEqual(track);
			expect(tracks.length).toBe(2);
		});

		it('should return an empty list, as the parent song does not exist', async () => {
			let tracks = await trackService.getSongTracks({ byId: { id: -1 } });
			expect(tracks).toStrictEqual([]);
		});
	});

	describe("Get a Song's Master Tracks", () => {
		it('should retrieve the song\'s master track', async () => {
			let track = await trackService.getMasterTrack({ byId: { id: song.id } });

			expect(track).toStrictEqual(track);
		});

		it('should throw, as the parent song does not exist', async () => {
			const test = async () => await trackService.getMasterTrack({ byId: { id: -1 } });
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});
	});

	describe("Count Tracks", () => {
		it("should count the song's tracks", async () => {
			let trackCount = await trackService.countTracks({ bySong: { byId: { id: song.id } } });
			expect(trackCount).toBe(2);
		});

		it("should count all the tracks", async () => {
			let trackCount = await trackService.countTracks({ });
			expect(trackCount).toBe(2);
		});
	});

	describe("Update Track", () => {
		it("should update the track's title", async () => {
			const newTitle = "My Song (2008 Version)";
			let updatedTrack = await trackService.updateTrack(
				{ displayName: newTitle },
				{ id: track.id }
			);

			expect(updatedTrack).toStrictEqual({...track, displayName: newTitle });
			track = updatedTrack;
		});

		it("should throw, as the track does not exist", async () => {
			const test = async () => await trackService.updateTrack({}, { id: -1 });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});
	});

	describe("Update Masters", () => {
		it("should unset song's master", async () => {
			let updatedTrack = await trackService.updateTrack(
				{ master: false },
				{ id: track.id }
			);

			expect(updatedTrack.master).toBe(false);
			expect(updatedTrack.id).toBe(track.id);
			let newMasterTrack = await trackService.getMasterTrack({ byId: { id: song.id }});
			expect(newMasterTrack).toStrictEqual({...track2, master: true });

		});

		it("should set song's master", async () => {
			let updatedTrack = await trackService.updateTrack(
				{ master: true },
				{ id: track.id }
			);

			expect(updatedTrack.master).toBe(true);
			expect(updatedTrack.id).toBe(track.id);
			let newMasterTrack = await trackService.getMasterTrack({ byId: { id: song.id }});
			expect(newMasterTrack).toStrictEqual(updatedTrack);
			let otherTrack = await trackService.getTrack({ id: track2.id });
			expect(otherTrack.master).toBe(false); 
		});
	});

	describe("Delete Track", () => {
		it("should delete the master track", async () => {
			await trackService.deleteTrack({ id: track.id });

			const test = async () => await trackService.getTrack({ id: track.id });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should have changed the master track of the song", async () => {
			let newMaster = await trackService.getMasterTrack({ byId: { id: song.id } });
			expect(newMaster.id).toBe(track2.id);
		});

		it("should delete the last song's track", async () => {
			await trackService.deleteTrack({ id: track2.id });

			const test = async () => await trackService.getTrack({ id: track2.id });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});

		it("should have delete the parent song", async () => {
			const test = async () => await songService.getSong({ byId: { id: song.id }});
			expect(test()).rejects.toThrow(SongNotFoundByIdException);
		});

		it("should have delete the parent artist", async () => {
			const test = async () => await artistService.getArtist({ id: artist.id  });
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});


		it("should throw, as the track does not exists", async () => {
			const test = async () => await trackService.getTrack({ id: -1 });
			expect(test()).rejects.toThrow(TrackNotFoundByIdException);
		});
	});
});