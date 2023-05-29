import { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Song } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import ReleaseService from "src/release/release.service";
import SongService from "src/song/song.service";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import SearchModule from "./search.module";
import request from "supertest";
import MetadataModule from "src/metadata/metadata.module";
import GenreService from "src/genre/genre.service";
import SetupApp from "test/setup-app";
import { expectedArtistResponse, expectedAlbumResponse, expectedSongResponse } from "test/expected-responses";

describe('Search Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PrismaModule, ArtistModule, TrackModule, AlbumModule, ReleaseModule, GenreModule, IllustrationModule, SearchModule, MetadataModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		app = await SetupApp(module);
		await dummyRepository.onModuleInit();
		const artistService = module.get(ArtistService);
		const albumService = module.get(AlbumService);
		const songService = module.get(SongService);
		const releaseService = module.get(ReleaseService);
		const genreService = module.get(GenreService);
		dummyRepository.artistA = await artistService.update({ name: 'Madonna' }, { id: dummyRepository.artistA.id }),
		dummyRepository.artistB	= await artistService.update({ name: 'Goldfrapp' }, { id: dummyRepository.artistB.id }),
		dummyRepository.artistC	= await artistService.update({ name: 'Doctor Rockit' }, { id: dummyRepository.artistC.id }),
		dummyRepository.albumA1	= await albumService.update({ name: 'American Life' }, { id: dummyRepository.albumA1.id }),
		dummyRepository.albumB1	= await albumService.update({ name: 'Tales of Us' }, { id: dummyRepository.albumB1.id }),
		dummyRepository.compilationAlbumA = await albumService.update({ name: 'Hotel Costes' }, { id: dummyRepository.compilationAlbumA.id }),
		dummyRepository.songA1	= await songService.update({ name: 'Hollywood' }, { id: dummyRepository.songA1.id }),
		dummyRepository.songA2	= await songService.update({ name: 'Intervention' }, { id: dummyRepository.songA2.id }),
		dummyRepository.songB1	= await songService.update({ name: 'Thea' }, { id: dummyRepository.songB1.id }),
		dummyRepository.songC1	= await songService.update({ name: 'Cafe de Flore' }, { id: dummyRepository.songC1.id });
		dummyRepository.releaseA1_1 = await releaseService.update({ name: 'American Life (Edited)' }, { id: dummyRepository.releaseA1_1.id });
		dummyRepository.releaseA1_2 = await releaseService.update({ name: 'American Life (Special Edition)' }, { id: dummyRepository.releaseA1_2.id });
		dummyRepository.releaseB1_1 = await releaseService.update({ name: 'Tales of Us' }, { id: dummyRepository.releaseB1_1.id });
		dummyRepository.compilationReleaseA1 = await releaseService.update({ name: 'Hotel Costes (Deluxe)' }, { id: dummyRepository.compilationReleaseA1.id });
		dummyRepository.genreC = await genreService.update({ name: 'Electronic' }, { id: dummyRepository.genreC.id } );
	});

	afterAll(() => {
		module.close();
		app.close();
	});

	describe('Search All', () => {
		it("Search All", () => {
			return request(app.getHttpServer())
				.get(`/search/all/l`)
				.expect(200)
				.expect((res) => {
					expect(res.body).toStrictEqual({
						artists: [
							expectedArtistResponse(dummyRepository.artistA),
							expectedArtistResponse(dummyRepository.artistB),
							expectedArtistResponse(dummyRepository.artistC)
						],
						albums: [
							expectedAlbumResponse(dummyRepository.albumA1),
							expectedAlbumResponse(dummyRepository.albumB1),
							expectedAlbumResponse(dummyRepository.compilationAlbumA)
						],
						songs: [
							expectedSongResponse(dummyRepository.songA1),
							expectedSongResponse(dummyRepository.songA2),
							expectedSongResponse(dummyRepository.songB1),
							expectedSongResponse(dummyRepository.songC1)
						],
						genres: [
							dummyRepository.genreC
						]
					})
				}) 
		});
	});	

	describe('Search Songs', () => {
		it("Search songs", () => {
			return request(app.getHttpServer())
				.get(`/search/songs/h`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(3);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA1));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songC1));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
				}) 
		});

		it("Search songs, w/ pagination", () => {
			return request(app.getHttpServer())
				.get(`/search/songs/e?skip=1&take=2`)
				.expect(200)
				.expect((res) => {
					const songs: Song[] = res.body.items;
					expect(songs.length).toBe(2);
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songA2));
					expect(songs).toContainEqual(expectedSongResponse(dummyRepository.songB1));
				}) 
		})
	});
});