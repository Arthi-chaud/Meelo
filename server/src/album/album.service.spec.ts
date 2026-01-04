import type { TestingModule } from "@nestjs/testing";
import { AlbumType } from "src/prisma/generated/client";
import { ArtistNotFoundException } from "src/artist/artist.exceptions";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import type { Album } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import SongModule from "src/song/song.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	AlbumAlreadyExistsException,
	AlbumNotEmptyException,
	AlbumNotFoundException,
} from "./album.exceptions";
import AlbumModule from "./album.module";
import AlbumService from "./album.service";

describe("Album Service", () => {
	let albumService: AlbumService;
	let artistService: ArtistService;
	let newAlbum: Album;
	let newCompilationAlbum: Album;
	let dummyRepository: TestPrismaService;
	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				AlbumModule,
				ArtistModule,
				PrismaModule,
				SongModule,
				IllustrationModule,
				GenreModule,
			],
			providers: [ArtistService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();

		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(artistService).toBeDefined();
		expect(albumService).toBeDefined();
	});

	describe("Create an album", () => {
		describe("No artist", () => {
			it("should create an album (no artist)", async () => {
				const registeredAt = new Date("2001");
				newCompilationAlbum = await albumService.create({
					name: "My Other Compilation Album",
					registeredAt,
				});

				expect(newCompilationAlbum.id).toBeDefined();
				expect(newCompilationAlbum.artistId).toBeNull();
				expect(newCompilationAlbum.releaseDate).toBeNull();
				expect(newCompilationAlbum.registeredAt).toStrictEqual(
					registeredAt,
				);
				expect(newCompilationAlbum.slug).toBe(
					"compilations-my-other-compilation-album",
				);
				expect(newCompilationAlbum.sortName).toBe(
					"My Other Compilation Album",
				);
				expect(newCompilationAlbum.sortSlug).toBe(
					"my-other-compilation-album",
				);
				expect(newCompilationAlbum.type).toBe(
					AlbumType.StudioRecording,
				);
			});

			it("should throw, as an album with the same name exists (no artist)", () => {
				const test = async () => {
					return albumService.create({
						name: dummyRepository.compilationAlbumA.name,
					});
				};
				return expect(test()).rejects.toThrow(
					AlbumAlreadyExistsException,
				);
			});

			it("should throw, as an album with the same name exists (w/ artist)", () => {
				const test = async () => {
					return albumService.create({
						name: dummyRepository.albumA1.name,
						artist: { id: dummyRepository.artistA.id },
					});
				};
				return expect(test()).rejects.toThrow(
					AlbumAlreadyExistsException,
				);
			});
		});

		describe("With artist", () => {
			it("should create a live album", async () => {
				newAlbum = await albumService.create({
					name: "My Live Album",
					artist: { slug: new Slug(dummyRepository.artistA.slug) },
					releaseDate: new Date("2006"),
				});
				expect(newAlbum.id).toBeDefined();
				expect(newAlbum.artistId).toBe(dummyRepository.artistA.id);
				expect(newAlbum.releaseDate).toStrictEqual(new Date("2006"));
				expect(newAlbum.registeredAt.getUTCDate()).toStrictEqual(
					new Date(Date.now()).getUTCDate(),
				);
				expect(newAlbum.name).toBe("My Live Album");
				expect(newAlbum.sortName).toBe(newAlbum.name);
				expect(newAlbum.sortSlug).toBe("my-live-album");
				expect(newAlbum.slug).toBe("my-artist-my-live-album");
				expect(newAlbum.type).toBe(AlbumType.LiveRecording);
			});

			it("should throw, as an album with the same name exists", () => {
				const test = async () => {
					return albumService.create({
						name: dummyRepository.albumA1.name,
						artist: { id: dummyRepository.artistA.id },
					});
				};
				return expect(test()).rejects.toThrow(
					AlbumAlreadyExistsException,
				);
			});

			it("should throw, as the related artist does not exists", () => {
				const test = async () => {
					return albumService.create({
						name: "My album (Live)",
						artist: { slug: new Slug("I do not exists") },
					});
				};
				return expect(test()).rejects.toThrow(ArtistNotFoundException);
			});
		});
	});

	describe("Get albums", () => {
		it("should find all the albums", async () => {
			const albums = await albumService.getMany({});
			expect(albums.length).toBe(5);
			expect(albums).toContainEqual(dummyRepository.albumA1);
			expect(albums).toContainEqual(dummyRepository.albumB1);
			expect(albums).toContainEqual(dummyRepository.compilationAlbumA);
			expect(albums).toContainEqual(newAlbum);
			expect(albums).toContainEqual(newCompilationAlbum);
		});

		it("should return albums from artist A or B", async () => {
			const albums = await albumService.getMany({
				artist: {
					or: [
						{ id: dummyRepository.artistA.id },
						{ id: dummyRepository.artistB.id },
					],
				},
			});
			expect(albums.length).toBe(3);
			expect(albums).toContainEqual(dummyRepository.albumA1);
			expect(albums).toContainEqual(dummyRepository.albumB1);
			expect(albums).toContainEqual(newAlbum);
		});
		it("should shuffle albums", async () => {
			const sort1 = await albumService.getMany({}, 123, { take: 10 }, {});
			const sort2 = await albumService.getMany(
				{},
				1234,
				{ take: 10 },
				{},
			);
			expect(sort1.length).toBe(sort2.length);
			expect(sort1).toContainEqual(dummyRepository.albumB1);
			expect(sort1.map(({ id }) => id)).not.toBe(
				sort2.map(({ id }) => id),
			);
		});

		it("should find some albums w/ pagination", async () => {
			const albums = await albumService.getMany(
				{},
				{},
				{ take: 2, skip: 2 },
			);
			expect(albums.length).toBe(2);
			expect(albums[0]).toStrictEqual(dummyRepository.compilationAlbumA);
			expect(albums[1]).toStrictEqual(newCompilationAlbum);
		});

		it("should find only live albums", async () => {
			const albums = await albumService.getMany({
				type: { is: AlbumType.LiveRecording },
			});
			expect(albums.length).toBe(1);
			expect(albums[0]).toStrictEqual(newAlbum);
		});

		it("should find only compilations albums", async () => {
			const albums = await albumService.getMany({
				type: { is: AlbumType.Compilation },
			});
			expect(albums.length).toBe(1);
			expect(albums[0]).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should sort the albums", async () => {
			const albums = await albumService.getMany(
				{},
				{ sortBy: "name", order: "desc" },
				{},
				{},
			);
			expect(albums.length).toBe(5);
			expect(albums[0]).toStrictEqual(dummyRepository.albumB1);
			expect(albums[1]).toStrictEqual(newCompilationAlbum);
			expect(albums[2]).toStrictEqual(newAlbum);
			expect(albums[3]).toStrictEqual(dummyRepository.compilationAlbumA);
			expect(albums[4]).toStrictEqual(dummyRepository.albumA1);
		});
	});

	describe("Get an album", () => {
		it("should find the album (w/o artist)", async () => {
			const album = await albumService.get({
				slug: new Slug(dummyRepository.compilationAlbumA.slug),
			});
			expect(album).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should find the album (w/ artist)", async () => {
			const album = await albumService.get({
				slug: new Slug(dummyRepository.albumA1.slug),
			});
			expect(album).toStrictEqual(dummyRepository.albumA1);
		});

		it("should find the album (by id)", async () => {
			const album = await albumService.get({
				id: dummyRepository.albumB1.id,
			});
			expect(album).toStrictEqual(dummyRepository.albumB1);
		});
	});

	describe("Update an album", () => {
		it("should change the information of the album in the database", async () => {
			const updatedAlbum = await albumService.update(
				{ type: AlbumType.Soundtrack },
				{ id: newAlbum.id },
			);
			expect(updatedAlbum).toStrictEqual({
				...newAlbum,
				type: AlbumType.Soundtrack,
			});
		});
	});

	describe("Find or create", () => {
		it("should find the existing album (no artist)", async () => {
			const fetchedAlbum = await albumService.getOrCreate({
				name: dummyRepository.compilationAlbumA.name,
			});

			expect(fetchedAlbum).toStrictEqual(
				dummyRepository.compilationAlbumA,
			);
		});

		it("should find the existing album (w/ artist)", async () => {
			const fetchedAlbum = await albumService.getOrCreate({
				name: dummyRepository.albumB1.name,
				artist: { slug: new Slug(dummyRepository.artistB.slug) },
			});

			expect(fetchedAlbum).toStrictEqual(dummyRepository.albumB1);
		});

		it("should create a new album", async () => {
			const otherAlbum = await albumService.getOrCreate({
				name: "My Third Compilation Album",
			});

			expect(otherAlbum.artistId).toBeNull();
			expect(otherAlbum).not.toStrictEqual(newCompilationAlbum);
			expect(otherAlbum).not.toStrictEqual(
				dummyRepository.compilationAlbumA,
			);
		});
	});

	describe("Delete Album", () => {
		it("should not delete the album, as it has releases", async () => {
			const albumQueryParameters = {
				id: dummyRepository.compilationAlbumA.id,
			};

			const test = async () =>
				await albumService.delete([albumQueryParameters]);
			return expect(test()).rejects.toThrow(AlbumNotEmptyException);
		});

		it("should delete the album", async () => {
			const tmpAlbum = await albumService.create({ name: "1234" });
			await albumService.delete([{ id: tmpAlbum.id }]);
			const test = async () => albumService.get({ id: tmpAlbum.id });
			return expect(test()).rejects.toThrow(AlbumNotFoundException);
		});
	});
});
