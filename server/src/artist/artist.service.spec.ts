import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import type { Artist } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseModule from "src/release/release.module";
import Slug from "src/slug/slug";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	ArtistNotEmptyException,
	ArtistNotFoundException,
} from "./artist.exceptions";
import ArtistModule from "./artist.module";
import ArtistService from "./artist.service";

describe("Artist Service", () => {
	let artistService: ArtistService;
	let dummyRepository: TestPrismaService;
	let newArtist: Artist;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				ArtistModule,
				PrismaModule,
				SongModule,
				AlbumModule,
				IllustrationModule,
				GenreModule,
				TrackModule,
				LyricsModule,
				ReleaseModule,
			],
			providers: [ArtistService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(artistService).toBeDefined();
	});

	describe("Create Artist", () => {
		it("should create a new artist", async () => {
			const registeredAt = new Date("2001");
			newArtist = await artistService.getOrCreate({
				name: "My New Artist",
				registeredAt,
			});
			expect(newArtist.name).toBe("My New Artist");
			expect(newArtist.slug).toBe("my-new-artist");
			expect(newArtist.sortName).toBe("My New Artist");
			expect(newArtist.sortSlug).toBe("my-new-artist");
			expect(newArtist.registeredAt).toStrictEqual(registeredAt);
			expect(newArtist.id).toBeDefined();
		});
	});

	describe("Get Artist", () => {
		it("should return an existing artist, without relations", async () => {
			const artist = await artistService.get({
				slug: new Slug(dummyRepository.artistC.slug),
			});
			expect(artist).toStrictEqual(dummyRepository.artistC);
		});

		it("should return an existing artist, with relations", async () => {
			const artist = await artistService.get(
				{ slug: new Slug(dummyRepository.artistB.slug) },
				{
					albums: true,
					songs: true,
				},
			);
			expect(artist).toStrictEqual({
				...dummyRepository.artistB,
				songs: [dummyRepository.songB1],
				albums: [dummyRepository.albumB1],
			});
		});
	});

	describe("Get Artists", () => {
		it("should return all artists", async () => {
			const artists = await artistService.getMany({});
			expect(artists.length).toBe(4);
			expect(artists).toContainEqual(dummyRepository.artistA);
			expect(artists).toContainEqual(dummyRepository.artistB);
			expect(artists).toContainEqual(dummyRepository.artistC);
			expect(artists).toContainEqual(newArtist);
		});

		it("should return all artists, sorted by name", async () => {
			const artists = await artistService.getMany(
				{},
				{ sortBy: "name", order: "asc" },
				{},
				{},
			);
			expect(artists.length).toBe(4);
			expect(artists[0]).toStrictEqual(dummyRepository.artistA);
			expect(artists[1]).toStrictEqual(newArtist);
			expect(artists[2]).toStrictEqual(dummyRepository.artistB);
			expect(artists[3]).toStrictEqual(dummyRepository.artistC);
		});
	});

	describe("Get Album Artists", () => {
		it("should return all album artists", async () => {
			const artists = await artistService.getMany({
				primaryArtistsOnly: true,
			});
			expect(artists.length).toBe(2);
			expect(artists).toContainEqual(dummyRepository.artistA);
			expect(artists).toContainEqual(dummyRepository.artistB);
		});

		it("should return all album artists, sorted by name", async () => {
			const artists = await artistService.getMany(
				{ primaryArtistsOnly: true },
				{ sortBy: "name", order: "desc" },
				{},
				{},
			);
			expect(artists.length).toBe(2);
			expect(artists[0]).toStrictEqual(dummyRepository.artistB);
			expect(artists[1]).toStrictEqual(dummyRepository.artistA);
		});
	});

	describe("Get or Create Artist", () => {
		it("should get the existing artist", async () => {
			const artistGet = await artistService.getOrCreate({
				name: dummyRepository.artistA.name,
			});
			expect(artistGet).toStrictEqual(dummyRepository.artistA);
		});

		it("should create a new artist, as it does not exists", async () => {
			const artist = await artistService.getOrCreate({
				name: "My Artist 2",
			});
			expect(artist.name).toBe("My Artist 2");
			expect(artist.slug).toBe("my-artist-2");
			expect(artist.id).not.toBe(dummyRepository.artistA.id);
			expect(artist.id).not.toBe(newArtist.id);
			expect(artist.id).not.toBe(dummyRepository.artistB.id);
			expect(artist.id).not.toBe(dummyRepository.artistC.id);
		});
	});

	describe("Delete Artist", () => {
		it("should delete the artist", async () => {
			const tmpArtist = await artistService.getOrCreate({ name: "1234" });
			const artistQueryParameters = {
				slug: new Slug(tmpArtist.slug),
			};
			await artistService.delete([artistQueryParameters]);
			const test = async () => artistService.get(artistQueryParameters);
			return expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
		it("should not delete the artist, as it is not empty", async () => {
			const artistQueryParameters = {
				slug: new Slug(dummyRepository.artistB.name),
			};
			const test = async () =>
				artistService.delete([artistQueryParameters]);
			return expect(test()).rejects.toThrow(ArtistNotEmptyException);
		});
	});
});
