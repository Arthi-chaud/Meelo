import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Release } from "src/prisma/models";
import { AlbumNotFoundException, AlbumNotFoundFromIDException } from "src/album/album.exceptions";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { ReleaseNotFoundException, ReleaseNotFoundFromIDException } from "./release.exceptions";
import ReleaseService from "./release.service";
import IllustrationModule from "src/illustration/illustration.module";
import MetadataModule from "src/metadata/metadata.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { ArtistNotFoundByIDException } from "src/artist/artist.exceptions";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import SongService from "src/song/song.service";

describe('Release Service', () => {
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	let artistService: ArtistService;
	let songService: SongService;
	let dummyRepository: TestPrismaService;

	let newRelease: Release;
	let newCompilationRelease: Release;
	let newRelease2: Release;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, TrackModule, IllustrationModule, SongModule, MetadataModule, GenreModule],
			providers: [ReleaseService, AlbumService, ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		artistService = module.get(ArtistService);
		songService = module.get(SongService);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	})

	it('should be defined', () => {
		expect(releaseService).toBeDefined();
	});
	
	describe('Create a release', () => {
		it("should create the album's first release", async () => {
			newRelease = await releaseService.create({
				name: 'My Album (Deluxe Edition)',
				album: { byId: { id: dummyRepository.albumA1.id } },
				releaseDate: new Date('2023'),
				master: false
			});
			expect(newRelease.albumId).toBe(dummyRepository.albumA1.id);
			expect(newRelease.master).toBe(false);
			expect(newRelease.releaseDate).toStrictEqual(new Date('2023'));
			expect(newRelease.name).toBe('My Album (Deluxe Edition)');
			expect(newRelease.slug).toBe('my-album-deluxe-edition');
		});

		it("should create the album's second release (compilation)", async () => {
			newCompilationRelease = await releaseService.create({
				name: 'My Compilation (Expanded Edition)',
				album: { byId: { id: dummyRepository.compilationAlbumA.id } },
				releaseDate: new Date('2005'),
				master: false
			});
			expect(newCompilationRelease.albumId).toBe(dummyRepository.compilationAlbumA.id);
			expect(newCompilationRelease.master).toBe(false);
			expect(newCompilationRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(newCompilationRelease.name).toBe('My Compilation (Expanded Edition)');
			expect(newCompilationRelease.slug).toBe('my-compilation-expanded-edition');
		});

		it("should update set as master and the parent album year", async () => {
			const newRelease2  = await releaseService.create({
				name: 'My Album (TMD Edition)',
				album: { byId: { id: dummyRepository.albumA1.id } },
				releaseDate: new Date('2006'),
				master: false
			});
			expect(newRelease2.master).toBe(true);
			const album = await albumService.get({ byId: { id: dummyRepository.albumA1.id } });
			expect(album.id).toStrictEqual(dummyRepository.albumA1.id);
			expect(album.releaseDate).toStrictEqual(new Date('2006'));
			await releaseService.delete({ byId: { id: newRelease2.id } });
			const expectedMaster = await releaseService.get({ byId: { id: dummyRepository.releaseA1_1.id } });
			expect(expectedMaster.master).toBe(true);
		});

		it("should not have updated the parent album metadata", async () => {
			const album = await albumService.get({ byId: { id: newCompilationRelease.albumId } });
			expect(album.releaseDate?.getFullYear()).toStrictEqual(dummyRepository.compilationAlbumA.releaseDate!.getFullYear());
			expect(album.name).toStrictEqual('My Compilation Album');
		});
	});

	describe('Get Releases', () => { 
		it("should get the releases", async () => {
			let releases = await releaseService.getMany({});
			expect(releases.length).toBe(6);
			expect(releases).toContainEqual(newRelease);
			expect(releases).toContainEqual(newCompilationRelease);
			expect(releases).toContainEqual(dummyRepository.releaseA1_1);
			expect(releases).toContainEqual(dummyRepository.releaseA1_2);
			expect(releases).toContainEqual(dummyRepository.releaseB1_1);
			expect(releases).toContainEqual(dummyRepository.compilationReleaseA1);
		});
		it("should get the releases, sorted by name", async () => {
			let releases = await releaseService.getMany({}, {}, {}, { sortBy: 'slug' });
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
			let fetchedRelease = await releaseService.get({
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
			let fetchedRelease = await releaseService.get({
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
			let release = await releaseService.select({ byId: { id: dummyRepository.releaseB1_1.id }}, { slug: true, id: true });
			expect(release).toStrictEqual({ id: dummyRepository.releaseB1_1.id, slug: dummyRepository.releaseB1_1.slug});
		});

		it(('should throw, as the release does not exist'), async () => {
			const test = () => releaseService.select({ byId: { id: -1 }}, { slug: true, id: true });
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});

		it("should throw, as the release does not exists", async () => {
			const test = async () => {
				return await releaseService.get({
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
				return await releaseService.get({
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
			let fetchedRelease = await releaseService.get({
				byId: { id: dummyRepository.releaseA1_2.id }
			});
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_2);
		});

		it("should throw, as no release has the id", async () => {
			const test = async () => {
				return await releaseService.get({ byId: { id: -1 } });
			}
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});
	});

	describe('Get Master Release', () => {
		it("Should retrieve the master release", async () => {
			let fetchedRelease = await releaseService.get(
				{ byMasterOf: {
					bySlug: {
						slug: new Slug(dummyRepository.albumA1.slug),
						artist: { slug: new Slug(dummyRepository.artistA.slug) }
					}
				}},
			);
			expect(fetchedRelease).toStrictEqual(dummyRepository.releaseA1_1);
		});

		it("Should retrieve the master release (compilation)", async () => {
			let compilationMaster = await releaseService.get(
				{ byMasterOf: { bySlug: { slug: new Slug(dummyRepository.compilationAlbumA.slug) } }},
			);

			expect(compilationMaster).toStrictEqual(dummyRepository.compilationReleaseA1);
		});
	});


	describe('Reassign Release', () => {
		it('should reassign a release to an album', async () => {
			const updatedRelease = await releaseService.reassign(
				{ byId: { id: dummyRepository.releaseB1_1.id } },
				{ byId: { id: dummyRepository.albumA1.id } }
			);
			expect(updatedRelease).toStrictEqual({
				...dummyRepository.releaseB1_1,
				master: false,
				albumId: dummyRepository.albumA1.id
			});
		});

		it("should have deleted the empty parent", async () => {
			const test = () => albumService.get({ byId: { id: dummyRepository.albumB1.id } });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException);
		});

		it("should have set the other release as master", async () => {
			dummyRepository.albumB1 = await albumService.create({
				name: dummyRepository.albumB1.name, artist: { id: dummyRepository.artistB.id }
			});
			await releaseService.reassign(
				{ byId: { id: dummyRepository.releaseA1_1.id } },
				{ byId: { id: dummyRepository.albumB1.id } }
			);
			const otherRelease = await releaseService.get(
				{ byId: { id: dummyRepository.releaseA1_2.id } }
			);
			expect(otherRelease).toStrictEqual({
				...dummyRepository.releaseA1_2,
				master: true,
			});
			await releaseService.reassign(
				{ byId: { id: dummyRepository.releaseB1_1.id } },
				{ byId: { id: dummyRepository.albumB1.id } }
			);
		});

		it("should assign a release to a compilation album", async () => {
			const updatedRelease = await releaseService.reassign(
				{ byId: { id: dummyRepository.releaseA1_1.id } },
				{ byId: { id: dummyRepository.compilationAlbumA.id } }
			);
			expect(updatedRelease).toStrictEqual({
				...dummyRepository.releaseA1_1,
				master: false,
				albumId: dummyRepository.compilationAlbumA.id
			});
			await releaseService.reassign(
				{ byId: { id: dummyRepository.releaseA1_1.id } },
				{ byId: { id: dummyRepository.albumA1.id } }
			);
			await releaseService.setReleaseAsMaster({
				album: { byId: { id: dummyRepository.albumA1.id }},
				releaseId: dummyRepository.releaseA1_1.id
			});
		});

	});

	describe('Update Release', () => {
		it("Should Update the release", async () => {
			let updatedRelease = await releaseService.update(
				{ name: 'My Album (Special Edition)' },
				{ byId: { id: newRelease.id } },
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
				{ byId: { id: newRelease.id } }
			);
			let updatedAlbum = await albumService.get(
				{ bySlug: { slug: new Slug(dummyRepository.albumA1.slug), artist: { slug: new Slug (dummyRepository.artistA.slug) } } },
				{ releases: true }
			);
			expect(updatedAlbum.releaseDate!.getFullYear()).toStrictEqual(2005);
		});

		it("Should Update the master release (unset)", async () => {
			await releaseService.update({ master: false }, { byId: { id: dummyRepository.releaseA1_1.id } });
			const expectedNewMaster = await releaseService.getMasterRelease({ byId: { id: dummyRepository.albumA1.id } });
			expect(expectedNewMaster).toStrictEqual({ ...dummyRepository.releaseA1_2, master: true });
		});

		it("Should Update the master release (set)", async () => {
			await releaseService.update({ master: true }, { byId: { id: dummyRepository.releaseA1_1.id } });
			const expectedNewMaster = await releaseService.getMasterRelease({ byId: { id: dummyRepository.albumA1.id } });
			expect(expectedNewMaster).toStrictEqual(dummyRepository.releaseA1_1);
			const unsetRelease = await releaseService.get({ byId: { id: dummyRepository.releaseA1_2.id } });
			expect(unsetRelease.master).toBe(false);

		});
	});

	describe('Find or create', () => {
		it("should retrieve the existing release", async () => {
			let fetchedRelease: Release = await releaseService.getOrCreate({
				name: newRelease.name, album: { byId: { id: dummyRepository.albumA1.id } }, releaseDate: new Date('2008'), master: false
			});
			expect(fetchedRelease).toStrictEqual(newRelease);
		});

		it("should create a new release", async () => {
			newRelease2 = await releaseService.getOrCreate({
				name: 'My Album (Edited Version)', album: { byId: { id: dummyRepository.albumA1.id } }, releaseDate: new Date('2007'), master: false
			});
			expect(newRelease2.albumId).toBe(dummyRepository.albumA1.id);
			expect(newRelease2.master).toBe(false);
			expect(newRelease2.releaseDate).toStrictEqual(new Date('2007'));
			expect(newRelease2.name).toBe("My Album (Edited Version)");
			expect(newRelease2.slug).toBe('my-album-edited-version');
		});
	});

	describe('Delete Release', () => {
		it("should delete only release, and parent album", async () => {
			await releaseService.delete({ byId: { id: dummyRepository.releaseB1_1.id } });
			const testRelease = async () => await releaseService.get({ byId: { id: dummyRepository.releaseB1_1.id } });
			const testAlbum = async () => await albumService.get({ byId: { id: dummyRepository.albumB1.id } });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			expect(testAlbum()).rejects.toThrow(AlbumNotFoundFromIDException);
		});

		it("should delete a release (not master)", async () => {
			const queryParam = { byId: { id: newRelease.id } };
			await releaseService.delete(queryParam);
			const testRelease = async () => await releaseService.get(queryParam);
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			/// To check album still exists
			let master = await releaseService.getMasterRelease({ byId: { id: dummyRepository.albumA1.id } });
			expect(master.id).toBe(newRelease2.id);
		});

		it("should delete master release, and update master status", async () => {
			await releaseService.delete({ byId: { id: newRelease2.id } });
			const testRelease = async () => await releaseService.get({ byId: { id: newRelease.id } });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			let updatedSecondRelease =  await releaseService.getMasterRelease({ byId: { id: dummyRepository.albumA1.id } });
			expect(updatedSecondRelease.id).toBe(dummyRepository.releaseA1_1.id);
		});
		
		it("should delete release, and parent album & artist", async () => {
			await releaseService.delete({ byId: { id: dummyRepository.releaseA1_1.id } });
			await releaseService.delete({ byId: { id: dummyRepository.releaseA1_2.id } });
			
			/// Also have to delete related song 
			await songService.delete({ id: dummyRepository.songA1.id });
			await songService.delete({ id: dummyRepository.songA2.id });
			///
			const testAlbum = async () => await albumService.get({ byId: { id: dummyRepository.albumA1.id } });
			expect(testAlbum()).rejects.toThrow(AlbumNotFoundFromIDException);
			const testArtist = async () => await artistService.get({ id: dummyRepository.artistA.id  });
			expect(testArtist()).rejects.toThrow(ArtistNotFoundByIDException);
		});
	});
})