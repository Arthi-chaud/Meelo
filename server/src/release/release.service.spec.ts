import type { TestingModule } from "@nestjs/testing";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import IllustrationModule from "src/illustration/illustration.module";
import ParserModule from "src/parser/parser.module";
import type { Release } from "src/prisma/models";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import TrackService from "src/track/track.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	MasterReleaseNotFoundException,
	ReleaseNotEmptyException,
	ReleaseNotFoundException,
} from "./release.exceptions";
import ReleaseService from "./release.service";

describe("Release Service", () => {
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	let trackService: TrackService;
	let dummyRepository: TestPrismaService;

	let newRelease: Release;
	let newCompilationRelease: Release;
	let newRelease2: Release;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PrismaModule,
				AlbumModule,
				ArtistModule,
				TrackModule,
				IllustrationModule,
				SongModule,
				ParserModule,
				GenreModule,
				FileModule,
			],
			providers: [ReleaseService, AlbumService, ArtistService],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		trackService = module.get(TrackService);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(releaseService).toBeDefined();
	});

	describe("Create a release", () => {
		it("should create the album's first release", async () => {
			const registeredAt = new Date("2005");
			newRelease = await releaseService.create({
				registeredAt,
				name: "My Album",
				extensions: ["Deluxe Edition"],
				album: { id: dummyRepository.albumA1.id },
				releaseDate: new Date("2023"),
				discogsId: "12345",
			});
			expect(newRelease.albumId).toBe(dummyRepository.albumA1.id);
			expect(newRelease.releaseDate).toStrictEqual(new Date("2023"));
			expect(newRelease.name).toBe("My Album");
			expect(newRelease.extensions).toStrictEqual(["Deluxe Edition"]);
			expect(newRelease.registeredAt).toStrictEqual(registeredAt);
			expect(newRelease.slug).toBe("my-artist-my-album-deluxe-edition");
			expect(newRelease.nameSlug).toBe("my-album-deluxe-edition");
		});

		it("should create the album's second release (compilation)", async () => {
			newCompilationRelease = await releaseService.create({
				name: "My Compilation",
				extensions: ["Expanded Edition"],
				album: { id: dummyRepository.compilationAlbumA.id },
				releaseDate: new Date("2005"),
			});
			expect(newCompilationRelease.albumId).toBe(
				dummyRepository.compilationAlbumA.id,
			);
			expect(newCompilationRelease.releaseDate).toStrictEqual(
				new Date("2005"),
			);
			expect(newCompilationRelease.name).toBe("My Compilation");
			expect(newCompilationRelease.extensions).toStrictEqual([
				"Expanded Edition",
			]);
			expect(
				newCompilationRelease.registeredAt.getUTCDate(),
			).toStrictEqual(new Date(Date.now()).getUTCDate());
			expect(newCompilationRelease.nameSlug).toBe(
				"my-compilation-expanded-edition",
			);
			expect(newCompilationRelease.slug).toBe(
				"compilations-my-compilation-expanded-edition",
			);
		});

		it("should update set as master and the parent album year", async () => {
			const newRelease2 = await releaseService.create({
				name: "My Album",
				extensions: ["TMD Edition"],
				album: { id: dummyRepository.albumA1.id },
				releaseDate: new Date("2006"),
			});
			const album = await albumService.get({
				id: dummyRepository.albumA1.id,
			});
			expect(album.id).toStrictEqual(dummyRepository.albumA1.id);
			expect(album.releaseDate).toStrictEqual(new Date("2006"));
			await releaseService.delete([{ id: newRelease2.id }]);
		});

		it("should not have updated the parent album metadata", async () => {
			const album = await albumService.get({
				id: newCompilationRelease.albumId,
			});
			expect(album.releaseDate?.getFullYear()).toStrictEqual(
				dummyRepository.compilationAlbumA.releaseDate!.getFullYear(),
			);
			expect(album.name).toStrictEqual("My Compilation Album");
		});
	});

	describe("Get Releases", () => {
		it("should get the releases", async () => {
			const releases = await releaseService.getMany({});
			expect(releases.length).toBe(6);
			expect(releases).toContainEqual(newRelease);
			expect(releases).toContainEqual(newCompilationRelease);
			expect(releases).toContainEqual(dummyRepository.releaseA1_1);
			expect(releases).toContainEqual(dummyRepository.releaseA1_2);
			expect(releases).toContainEqual(dummyRepository.releaseB1_1);
			expect(releases).toContainEqual(
				dummyRepository.compilationReleaseA1,
			);
		});

		it("should get the releases, sorted by name", async () => {
			const releases = await releaseService.getMany(
				{},
				{ sortBy: "name", order: "asc" },
				{},
				{},
			);
			expect(releases.length).toBe(6);
			expect(releases[0]).toStrictEqual(dummyRepository.releaseA1_1);
			expect(releases[1]).toStrictEqual(dummyRepository.releaseA1_2);
			expect(releases[2]).toStrictEqual(newRelease);
			expect(releases[3]).toStrictEqual(
				dummyRepository.compilationReleaseA1,
			);
			expect(releases[4]).toStrictEqual(newCompilationRelease);
			expect(releases[5]).toStrictEqual(dummyRepository.releaseB1_1);
		});
	});

	describe("Get Release", () => {
		it("should get the release", async () => {
			const fetchedRelease = await releaseService.get({
				slug: new Slug(dummyRepository.releaseA1_1.slug),
			});
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_1);
		});

		it("should get the release (compilation)", async () => {
			const fetchedRelease = await releaseService.get({
				slug: new Slug(newCompilationRelease.slug),
			});
			expect(fetchedRelease).toStrictEqual(newCompilationRelease);
		});

		it("should throw, as the release does not exists", async () => {
			const test = async () => {
				return releaseService.get({
					slug: new Slug("I Do not exists"),
				});
			};
			return expect(test()).rejects.toThrow(ReleaseNotFoundException);
		});

		it("should get the release from its id", async () => {
			const fetchedRelease = await releaseService.get({
				id: dummyRepository.releaseA1_2.id,
			});
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_2);
		});

		it("should throw, as no release has the id", async () => {
			const test = async () => {
				return releaseService.get({ id: -1 });
			};
			return expect(test()).rejects.toThrow(ReleaseNotFoundException);
		});
	});

	describe("Get Master Release", () => {
		it("Should retrieve the master release", async () => {
			const fetchedRelease = await releaseService.getMasterRelease({
				slug: new Slug(dummyRepository.albumA1.slug),
			});
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_1);
		});

		it("Should retrieve the master release (compilation)", async () => {
			const compilationMaster = await releaseService.getMasterRelease({
				slug: new Slug(dummyRepository.compilationAlbumA.slug),
			});

			expect(compilationMaster).toStrictEqual(
				dummyRepository.compilationReleaseA1,
			);
		});
		it("Should throw, as the album does not have releases", async () => {
			const tmpAlbum = await albumService.create({ name: "A" });
			const test = () =>
				releaseService.getMasterRelease({ id: tmpAlbum.id });

			return expect(test()).rejects.toThrow(
				MasterReleaseNotFoundException,
			);
		});
	});

	describe("Update Release", () => {
		it("Should Update the album's date", async () => {
			newRelease = await releaseService.update(
				{ releaseDate: new Date("2005") },
				{ id: newRelease.id },
			);
			const updatedAlbum = await albumService.get(
				{
					slug: new Slug(dummyRepository.albumA1.slug),
				},
				{ releases: true },
			);
			expect(updatedAlbum.releaseDate!.getFullYear()).toStrictEqual(2005);
		});
	});

	describe("Find or create", () => {
		it("should retrieve the existing release", async () => {
			const fetchedRelease: Release = await releaseService.getOrCreate({
				name: newRelease.name,
				extensions: ["Deluxe Edition"],
				album: { id: dummyRepository.albumA1.id },
				releaseDate: new Date("2008"),
			});
			expect(fetchedRelease).toStrictEqual(newRelease);
		});

		it("should create a new release", async () => {
			newRelease2 = await releaseService.getOrCreate({
				name: "My Album",
				extensions: ["Edited Version"],
				album: { id: dummyRepository.albumA1.id },
				releaseDate: new Date("2007"),
			});
			expect(newRelease2.albumId).toBe(dummyRepository.albumA1.id);
			expect(newRelease2.releaseDate).toStrictEqual(new Date("2007"));
			expect(newRelease2.name).toBe("My Album");
			expect(newRelease2.nameSlug).toBe("my-album-edited-version");
			expect(newRelease2.slug).toBe("my-artist-my-album-edited-version");
		});
	});

	describe("Delete Release", () => {
		it("should throw, as the release does not exist", async () => {
			const testRelease = async () =>
				await releaseService.get({ id: -1 });
			return expect(testRelease()).rejects.toThrow(
				ReleaseNotFoundException,
			);
		});
		it("should not delete release,as it is not empty", async () => {
			const testRelease = async () =>
				await releaseService.delete([
					{
						id: dummyRepository.releaseB1_1.id,
					},
				]);
			return expect(testRelease()).rejects.toThrow(
				ReleaseNotEmptyException,
			);
		});
		it("should delete the master release", async () => {
			await trackService.delete([{ id: dummyRepository.trackB1_1.id }]);
			await albumService.update(
				{
					master: { id: dummyRepository.releaseB1_1.id },
				},
				{ id: dummyRepository.albumB1.id },
			);
			await releaseService.delete([
				{ id: dummyRepository.releaseB1_1.id },
			]);
			const testRelease = async () =>
				await releaseService.get({
					id: dummyRepository.releaseB1_1.id,
				});
			return expect(testRelease()).rejects.toThrow(
				ReleaseNotFoundException,
			);
		});
		it("should have unset the album's master id", async () => {
			const album = await albumService.get({
				id: dummyRepository.albumB1.id,
			});
			expect(album.masterId).toBeNull();
		});
	});
});
