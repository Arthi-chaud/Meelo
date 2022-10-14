import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import SearchModule from "./search.module";
import SearchService from "./search.service";

describe('Search Service', () => {
	let searchService: SearchService;
	let dummyRepository: TestPrismaService;

	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, ReleaseModule, GenreModule, IllustrationModule, SearchModule],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		searchService = module.get(SearchService);
		await dummyRepository.onModuleInit();
		const artistService = module.get(ArtistService);
		const albumService = module.get(AlbumService);
		const songService = module.get(SongService);
		const releaseService = module.get(ReleaseService);
		dummyRepository.artistA = await artistService.update({ name: 'Madonna' }, { id: dummyRepository.artistA.id }),
		dummyRepository.artistB	= await artistService.update({ name: 'Goldfrapp' }, { id: dummyRepository.artistB.id }),
		dummyRepository.artistC	= await artistService.update({ name: 'Doctor Rockit' }, { id: dummyRepository.artistC.id }),
		dummyRepository.albumA1	= await albumService.update({ name: 'American Life' }, { byId: { id: dummyRepository.albumA1.id } }),
		dummyRepository.albumB1	= await albumService.update({ name: 'Tales of Us' }, { byId: { id: dummyRepository.albumB1.id } }),
		dummyRepository.compilationAlbumA = await albumService.update({ name: 'Hotel Costes' }, { byId: { id: dummyRepository.compilationAlbumA.id } }),
		dummyRepository.songA1	= await songService.update({ name: 'Hollywood' }, { byId: { id: dummyRepository.songA1.id } }),
		dummyRepository.songA2	= await songService.update({ name: 'Intervention' }, { byId: { id: dummyRepository.songA2.id } }),
		dummyRepository.songB1	= await songService.update({ name: 'Thea' }, { byId: { id: dummyRepository.songB1.id } }),
		dummyRepository.songC1	= await songService.update({ name: 'Cafe de Flore' }, { byId: { id: dummyRepository.songC1.id } });
		dummyRepository.releaseA1_1 = await releaseService.update({ name: 'American Life (Edited)' }, { byId: { id: dummyRepository.releaseA1_1.id } });
		dummyRepository.releaseA1_2 = await releaseService.update({ name: 'American Life (Special Edition)' }, { byId: { id: dummyRepository.releaseA1_2.id } });
		dummyRepository.releaseB1_1 = await releaseService.update({ name: 'Tales of Us' }, { byId: { id: dummyRepository.releaseB1_1.id } });
		dummyRepository.compilationReleaseA1 = await releaseService.update({ name: 'Hotel Costes (Deluxe)' }, { byId: { id: dummyRepository.compilationReleaseA1.id } });
	});

	it("should be defined", () => {
		expect(searchService).toBeDefined();
	});

	describe('Search Artists', () => {
		it("should find some artists", async () => {
			const artists = await searchService.searchArtists('A');
			expect(artists.length).toBe(2);
			expect(artists).toContainEqual(dummyRepository.artistA);
			expect(artists).toContainEqual(dummyRepository.artistB);
		});

		it("should find only album artists", async () => {
			const artists = await searchService.searchArtists('Doctor');
			expect(artists).not.toContainEqual(dummyRepository.artistC)
		});

		it("should find some artists, paginated", async () => {
			const artists = await searchService.searchArtists('A', { take: 1 });
			expect(artists.length).toBe(1);
			expect(artists).toContainEqual(dummyRepository.artistA);
		});

		it("should find some artists, with related album", async () => {
			const artists = await searchService.searchArtists('p', {}, { albums: true });
			expect(artists.length).toBe(1);
			expect(artists).toContainEqual({
				...dummyRepository.artistB,
				albums: [
					dummyRepository.albumB1
				]
			});
		});
	});

	describe('Search Albums', () => {
		it("should find some Albums", async () => {
			const albums = await searchService.searchAlbums('t');
			expect(albums.length).toBe(2);
			expect(albums).toContainEqual(dummyRepository.albumB1);
			expect(albums).toContainEqual(dummyRepository.compilationAlbumA);
		});

		it("should find some Albums, paginated", async () => {
			const albums = await searchService.searchAlbums('s', { take: 1 });
			expect(albums.length).toBe(1);
			expect(albums).toContainEqual(dummyRepository.albumB1);
		});

		it("should find some Albums, with related artist", async () => {
			const albums = await searchService.searchAlbums('l', {}, { artist: true });
			expect(albums.length).toBe(3);
			expect(albums).toContainEqual({
				...dummyRepository.compilationAlbumA,
				artist: null
			});
			expect(albums).toContainEqual({
				...dummyRepository.albumA1,
				artist: dummyRepository.artistA
			});
			expect(albums).toContainEqual({
				...dummyRepository.albumB1,
				artist: dummyRepository.artistB
			});
		});
	});

	describe('Search Songs', () => {
		it("should find some songs", async () => {
			const songs = await searchService.searchSongs('h');
			expect(songs.length).toBe(2);
			expect(songs).toContainEqual(dummyRepository.songA1);
			expect(songs).toContainEqual(dummyRepository.songB1);
		});

		it("should find some songs, paginated", async () => {
			const songs = await searchService.searchSongs('e', { skip: 1 });
			expect(songs.length).toBe(2);
			expect(songs).toContainEqual(dummyRepository.songB1);
			expect(songs).toContainEqual(dummyRepository.songC1);
		});

		it("should find some songs, with related tracks", async () => {
			const songs = await searchService.searchSongs(' ', {}, { tracks: true, artist: true });
			expect(songs.length).toBe(1);
			expect(songs).toContainEqual({
				...dummyRepository.songC1,
				artist: dummyRepository.artistC,
				tracks: [
					dummyRepository.trackC1_1
				]
			});
		});
	});

	describe('Search Releases', () => {
		it("should find some releases", async () => {
			const releases = await searchService.searchReleases('ed');
			expect(releases.length).toBe(2);
			expect(releases).toContainEqual(dummyRepository.releaseA1_1);
			expect(releases).toContainEqual(dummyRepository.releaseA1_2);
		});

		it("should find some releases, paginated", async () => {
			const releases = await searchService.searchReleases('ed', { skip: 1 });
			expect(releases.length).toBe(1);
			expect(releases).toContainEqual(dummyRepository.releaseA1_2);
		});

		it("should find some releases, with related album", async () => {
			const releases = await searchService.searchReleases('(', { }, { album: true });
			expect(releases.length).toBe(3);
			expect(releases).toContainEqual({
				...dummyRepository.releaseA1_1,
				album: dummyRepository.albumA1
			});
			expect(releases).toContainEqual({
				...dummyRepository.releaseA1_2,
				album: dummyRepository.albumA1
			});
			expect(releases).toContainEqual({
				...dummyRepository.compilationReleaseA1,
				album: dummyRepository.compilationAlbumA
			});
		});
	});

	describe('Search Genres', () => {
		it("should find some genres", async () => {
			const genres = await searchService.searchGenres('a');
			expect(genres.length).toBe(1);
			expect(genres).toContainEqual(dummyRepository.genreA);
		});

		it("should find some genres, paginated", async () => {
			const genres = await searchService.searchGenres('e', { skip: 1 });
			expect(genres.length).toBe(2);
			expect(genres).toContainEqual(dummyRepository.genreB);
			expect(genres).toContainEqual(dummyRepository.genreC);
		});
	});
});