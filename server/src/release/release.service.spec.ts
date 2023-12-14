import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Release } from "src/prisma/models";
import { AlbumNotFoundException } from "src/album/album.exceptions";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { MasterReleaseNotFoundException, ReleaseNotEmptyException, ReleaseNotFoundException, ReleaseNotFoundFromIDException } from "./release.exceptions";
import ReleaseService from "./release.service";
import IllustrationModule from "src/illustration/illustration.module";
import ScannerModule from "src/scanner/scanner.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import FileModule from "src/file/file.module";
import TrackService from "src/track/track.service";
import ProvidersModule from "src/providers/providers.module";
import ProviderService from "src/providers/provider.service";

describe('Release Service', () => {
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
			imports: [PrismaModule, AlbumModule, ArtistModule, TrackModule, IllustrationModule, SongModule, ScannerModule, GenreModule, FileModule, ProvidersModule],
			providers: [ReleaseService, AlbumService, ArtistService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		trackService = module.get(TrackService);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		await module.get(ProviderService).onModuleInit();
	})

	afterAll(() => {
		module.close();
	});

	it('should be defined', () => {
		expect(releaseService).toBeDefined();
	});
	
	describe('Create a release', () => {
		it("should create the album's first release", async () => {
			const registeredAt = new Date("2005");
			newRelease = await releaseService.create({
				registeredAt,
				name: 'My Album (Deluxe Edition)',
				album: { id: dummyRepository.albumA1.id },
				releaseDate: new Date('2023'),
				discogsId: '12345'
			});
			expect(newRelease.albumId).toBe(dummyRepository.albumA1.id);
			expect(newRelease.releaseDate).toStrictEqual(new Date('2023'));
			expect(newRelease.name).toBe('My Album (Deluxe Edition)');
			expect(newRelease.registeredAt).toStrictEqual(registeredAt);
			expect(newRelease.slug).toBe('my-album-deluxe-edition');
		});

		it("should create the album's second release (compilation)", async () => {
			newCompilationRelease = await releaseService.create({
				name: 'My Compilation (Expanded Edition)',
				album: { id: dummyRepository.compilationAlbumA.id },
				releaseDate: new Date('2005')
			});
			expect(newCompilationRelease.albumId).toBe(dummyRepository.compilationAlbumA.id);
			expect(newCompilationRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(newCompilationRelease.name).toBe('My Compilation (Expanded Edition)');
			expect(newCompilationRelease.registeredAt.getUTCDate()).toStrictEqual(new Date(Date.now()).getUTCDate());
			expect(newCompilationRelease.slug).toBe('my-compilation-expanded-edition');
		});

		it("should update set as master and the parent album year", async () => {
			const newRelease2  = await releaseService.create({
				name: 'My Album (TMD Edition)',
				album: { id: dummyRepository.albumA1.id },
				releaseDate: new Date('2006'),
			});
			const album = await albumService.get({ id: dummyRepository.albumA1.id });
			expect(album.id).toStrictEqual(dummyRepository.albumA1.id);
			expect(album.releaseDate).toStrictEqual(new Date('2006'));
			await releaseService.delete({ id: newRelease2.id });
		});

		it("should not have updated the parent album metadata", async () => {
			const album = await albumService.get({ id: newCompilationRelease.albumId });
			expect(album.releaseDate?.getFullYear()).toStrictEqual(dummyRepository.compilationAlbumA.releaseDate!.getFullYear());
			expect(album.name).toStrictEqual('My Compilation Album');
		});
	});

	describe('Get Releases', () => { 
		it("should get the releases", async () => {
			const releases = await releaseService.getMany({});
			expect(releases.length).toBe(6);
			expect(releases).toContainEqual(newRelease);
			expect(releases).toContainEqual(newCompilationRelease);
			expect(releases).toContainEqual(dummyRepository.releaseA1_1);
			expect(releases).toContainEqual(dummyRepository.releaseA1_2);
			expect(releases).toContainEqual(dummyRepository.releaseB1_1);
			expect(releases).toContainEqual(dummyRepository.compilationReleaseA1);
		});
		it("should shuffle release", async () => {
			const sort1 = await releaseService.getMany({ }, { take: 10 }, {}, 123);
			const sort2 = await releaseService.getMany({ }, { take: 10 }, {}, 1234);
			expect(sort1.length).toBe(sort2.length);
			expect(sort1).toContainEqual(dummyRepository.releaseB1_1);
			expect(sort1.map(({ id }) => id)).not.toBe(sort2.map(({ id }) => id));
		});
		it("should get the releases, sorted by name", async () => {
			const releases = await releaseService.getMany({}, {}, {}, { sortBy: 'name', order: 'asc' });
			expect(releases.length).toBe(6);
			expect(releases[0]).toStrictEqual(dummyRepository.releaseA1_1);
			expect(releases[1]).toStrictEqual(dummyRepository.releaseA1_2);
			expect(releases[2]).toStrictEqual(newRelease);
			expect(releases[3]).toStrictEqual(dummyRepository.compilationReleaseA1);
			expect(releases[4]).toStrictEqual(newCompilationRelease);
			expect(releases[5]).toStrictEqual(dummyRepository.releaseB1_1);
		});
	});

	describe('Get Release', () => { 
		it("should get the release", async () => {
			const fetchedRelease = await releaseService.get({
				bySlug: {
					slug: new Slug(dummyRepository.releaseA1_1.slug),
					album: {
						bySlug: {
							slug: new Slug(dummyRepository.albumA1.slug),
							artist: { slug: new Slug(dummyRepository.artistA.slug) }
						}
					},	
				}
			});
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_1);
		});

		it("should get the release (compilation)", async () => {
			const fetchedRelease = await releaseService.get({
				bySlug: {
					slug: new Slug(newCompilationRelease.slug),
					album: {
						bySlug: {
							slug: new Slug(dummyRepository.compilationAlbumA.slug),
						}
					},
				}
			});
			expect(fetchedRelease).toStrictEqual(newCompilationRelease);
		});

		it(('should return an existing release, without only its id and slug'), async () => {
			const release = await releaseService.select({ id: dummyRepository.releaseB1_1.id }, { slug: true, id: true });
			expect(release).toStrictEqual({ id: dummyRepository.releaseB1_1.id, slug: dummyRepository.releaseB1_1.slug});
		});

		it(('should throw, as the release does not exist'), async () => {
			const test = () => releaseService.select({ id: -1 }, { slug: true, id: true });
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});

		it("should throw, as the release does not exists", async () => {
			const test = async () => {
				return releaseService.get({
					bySlug: {
						slug: new Slug('I Do not exists'),
						album: {
							bySlug: {
								slug: new Slug('My Album'),
								artist: { slug: new Slug('My Artist') }
							}
						},
					}
				});
			}
			expect(test()).rejects.toThrow(ReleaseNotFoundException);
		});

		it("should throw, as the release's album does not exists", async () => {
			const test = async () => {
				return releaseService.get({
					bySlug: {
						slug: new Slug('I Do not exists'),
						album: {
							bySlug: {
								slug: new Slug('Me neither'),
							}
						},
					}
				});
			}
			expect(test()).rejects.toThrow(AlbumNotFoundException);
		});

		it("should get the release from its id", async () => {
			const fetchedRelease = await releaseService.get({
				id: dummyRepository.releaseA1_2.id
			});
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_2);
		});

		it("should throw, as no release has the id", async () => {
			const test = async () => {
				return releaseService.get({ id: -1 });
			}
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});
	});

	describe('Get Master Release', () => {
		it("Should retrieve the master release", async () => {
			const fetchedRelease = await releaseService.getMasterRelease(
				{ bySlug: {
						slug: new Slug(dummyRepository.albumA1.slug),
						artist: { slug: new Slug(dummyRepository.artistA.slug) }
					}
				},
			);
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_1);
		});

		it("Should retrieve the master release (compilation)", async () => {
			const compilationMaster = await releaseService.getMasterRelease(
				{ bySlug: { slug: new Slug(dummyRepository.compilationAlbumA.slug) } },
			);

			expect(compilationMaster).toStrictEqual(dummyRepository.compilationReleaseA1);
		});
		it("Should throw, as the album does not have releases", async () => {
			const tmpAlbum = await albumService.create({ name: 'A'  });
			const test = () => releaseService.getMasterRelease({ id: tmpAlbum.id });
			
			expect(test()).rejects.toThrow(MasterReleaseNotFoundException);
		});

	});


	describe('Reassign Release', () => {
		it('should reassign a release to an album', async () => {
			const updatedRelease = await releaseService.reassign(
				{ id: dummyRepository.releaseB1_1.id },
				{ id: dummyRepository.albumA1.id }
			);
			expect(updatedRelease).toStrictEqual({
				...dummyRepository.releaseB1_1,
				albumId: dummyRepository.albumA1.id
			});
		});

		it("should assign a release to a compilation album", async () => {
			const updatedRelease = await releaseService.reassign(
				{ id: dummyRepository.releaseA1_1.id },
				{ id: dummyRepository.compilationAlbumA.id }
			);
			expect(updatedRelease).toStrictEqual({
				...dummyRepository.releaseA1_1,
				albumId: dummyRepository.compilationAlbumA.id
			});
			await releaseService.reassign(
				{ id: dummyRepository.releaseA1_1.id },
				{ id: dummyRepository.albumA1.id }
			);
		});

	});

	describe('Update Release', () => {
		it("Should Update the release", async () => {
			const updatedRelease = await releaseService.update(
				{ name: 'My Album (Special Edition)' },
				{ id: newRelease.id },
			);
			expect(updatedRelease.id).toStrictEqual(newRelease.id);
			expect(updatedRelease.albumId).toStrictEqual(newRelease.albumId);
			expect(updatedRelease.name).toStrictEqual('My Album (Special Edition)');
			expect(updatedRelease.slug).toBe('my-album-special-edition');
			newRelease = updatedRelease;
		});

		it("Should Update the album's date", async () => {
			newRelease = await releaseService.update(
				{ releaseDate: new Date('2005') },
				{ id: newRelease.id }
			);
			const updatedAlbum = await albumService.get(
				{ bySlug: { slug: new Slug(dummyRepository.albumA1.slug), artist: { slug: new Slug (dummyRepository.artistA.slug) } } },
				{ releases: true }
			);
			expect(updatedAlbum.releaseDate!.getFullYear()).toStrictEqual(2005);
		});
	});

	describe('Find or create', () => {
		it("should retrieve the existing release", async () => {
			const fetchedRelease: Release = await releaseService.getOrCreate({
				name: newRelease.name, album: { id: dummyRepository.albumA1.id }, releaseDate: new Date('2008')
			});
			expect(fetchedRelease).toStrictEqual(newRelease);
		});

		it("should create a new release", async () => {
			newRelease2 = await releaseService.getOrCreate({
				name: 'My Album (Edited Version)', album: { id: dummyRepository.albumA1.id }, releaseDate: new Date('2007')
			});
			expect(newRelease2.albumId).toBe(dummyRepository.albumA1.id);
			expect(newRelease2.releaseDate).toStrictEqual(new Date('2007'));
			expect(newRelease2.name).toBe("My Album (Edited Version)");
			expect(newRelease2.slug).toBe('my-album-edited-version');
		});
	});

	describe('Delete Release', () => {
		it("should throw, as the release does not exist", async () => {
			const testRelease = async () => await releaseService.get({ id: -1 });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});
		it("should not delete release,as it is not empty", async () => {
			const testRelease = async () => await releaseService.delete({ id: dummyRepository.releaseB1_1.id });
			expect(testRelease()).rejects.toThrow(ReleaseNotEmptyException);
		});
		it("should delete the master release", async () => {
			await trackService.delete({ id: dummyRepository.trackB1_1.id });
			await albumService.setMasterRelease(
				{ id: dummyRepository.releaseB1_1.id }
			);
			await releaseService.delete({ id: dummyRepository.releaseB1_1.id });
			const testRelease = async () => await releaseService.get({ id: dummyRepository.releaseB1_1.id });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});
		it("should have unset the album's master id", async () => {
			const album = await albumService.select({ id: dummyRepository.albumB1.id }, { masterId: true });
			expect(album.masterId).toBeNull();
		});
	})
})