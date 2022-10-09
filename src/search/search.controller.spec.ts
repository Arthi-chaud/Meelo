import { INestApplication, ValidationPipe } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Artist, Album, Song, Release } from "src/prisma/models";
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
import request from "supertest";
import MetadataModule from "src/metadata/metadata.module";
import GenreService from "src/genre/genre.service";

describe('Search Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	const expectedArtistResponse = (artist: Artist) => ({
		...artist,
		illustration: null
	});

	const expectedAlbumResponse = (album: Album) => ({
		...album,
		releaseDate: album.releaseDate?.toISOString() ?? null,
		illustration: null
	});

	const expectedSongResponse = (song: Song) => ({
		...song,
		illustration: null
	});

	const expectedReleaseResponse = (release: Release) => ({
		...release,
		releaseDate: release.releaseDate?.toISOString() ?? null,
		illustration: null
	});

	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, ReleaseModule, GenreModule, IllustrationModule, SearchModule, MetadataModule],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		app = module.createNestApplication();
		app.useGlobalPipes(new ValidationPipe());
		await app.init();
		await dummyRepository.onModuleInit();
		let artistService = module.get(ArtistService);
		let albumService = module.get(AlbumService);
		let songService = module.get(SongService);
		let releaseService = module.get(ReleaseService);
		let genreService = module.get(GenreService);
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
		dummyRepository.genreC = await genreService.update({ name: 'Electronic' }, { id: dummyRepository.genreC.id } );
	});

	describe('Search All', () => {
		it("Search All", () => {
			return request(app.getHttpServer())
				.get(`/search/all/l`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						artists: [
							expectedArtistResponse(dummyRepository.artistB)
						],
						albums: [
							expectedAlbumResponse(dummyRepository.albumA1),
							expectedAlbumResponse(dummyRepository.albumB1),
							expectedAlbumResponse(dummyRepository.compilationAlbumA)
						],
						songs: [
							expectedSongResponse(dummyRepository.songA1),
							expectedSongResponse(dummyRepository.songC1)
						],
						releases: [
							expectedReleaseResponse(dummyRepository.releaseA1_1),
							expectedReleaseResponse(dummyRepository.releaseA1_2),
							expectedReleaseResponse(dummyRepository.releaseB1_1),
							expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						],
						genres: [
							dummyRepository.genreC
						]
					})
				}) 
		});
	});

	describe('Search Artists', () => {
		it("Search artists", () => {
			return request(app.getHttpServer())
				.get(`/search/artists/a`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(2);
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistA));
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistB));
				}) 
		});

		it("Search artists, w/ pagination", () => {
			return request(app.getHttpServer())
				.get(`/search/artists/a?skip=1`)
				.expect(200)
				.expect((res) => {
					let artists: Artist[] = res.body.items;
					expect(artists.length).toBe(1);
					expect(artists).toContainEqual(expectedArtistResponse(dummyRepository.artistB));
				}) 
		})
	});

	describe('Search Albums', () => {
		it("Search albums", () => {
			return request(app.getHttpServer())
				.get(`/search/albums/es`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(2);
					expect(albums).toContainEqual(expectedAlbumResponse(dummyRepository.albumB1));
					expect(albums).toContainEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
				}) 
		});

		it("Search albums, w/ pagination", () => {
			return request(app.getHttpServer())
				.get(`/search/albums/a?take=1`)
				.expect(200)
				.expect((res) => {
					let albums: Album[] = res.body.items;
					expect(albums.length).toBe(1);
					expect(albums).toContainEqual(expectedAlbumResponse(dummyRepository.albumA1));
				}) 
		})
	});

	describe('Search Songs', () => {
		it("Search songs", () => {
			return request(app.getHttpServer())
				.get(`/search/songs/h`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
				}) 
		});

		it("Search songs, w/ pagination", () => {
			return request(app.getHttpServer())
				.get(`/search/songs/e?take=2`)
				.expect(200)
				.expect((res) => {
					let songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
				}) 
		})
	});

	describe('Search Releases', () => {
		it("Search Releases", () => {
			return request(app.getHttpServer())
				.get(`/search/releases/fe`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases).toContainEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases).toContainEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
				}) 
		});

		it("Search releases, w/ pagination", () => {
			return request(app.getHttpServer())
				.get(`/search/releases/u?skip=1`)
				.expect(200)
				.expect((res) => {
					let releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases).toContainEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
				}) 
		})
	});
});