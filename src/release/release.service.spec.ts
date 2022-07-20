import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Artist, Release } from "@prisma/client";
import { AlbumNotFoundException, AlbumNotFoundFromIDException } from "src/album/album.exceptions";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { ReleaseNotFoundException, ReleaseNotFoundFromIDException } from "./release.exceptions";
import ReleaseService from "./release.service";
import IllustrationModule from "src/illustration/illustration.module";
import MetadataModule from "src/metadata/metadata.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
import { ArtistNotFoundByIDException } from "src/artist/artist.exceptions";

describe('Release Service', () => {
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	let artistService: ArtistService
	let album: Album & { releases: Release[], artist: Artist | null };
	let compilationAlbum: Album & { releases: Release[], artist: Artist | null };
	let standardRelease: Release & { album: Album };
	let deluxeRelease: Release & { album: Album };
	let editedRelease: Release & { album: Album };
	let compilationRelease: Release;
	let artist: Artist;
	
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, TrackModule, IllustrationModule, SongModule, MetadataModule],
			providers: [ReleaseService, AlbumService, ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		artistService = module.get<ArtistService>(ArtistService);
		artist = await artistService.createArtist({ name: 'My Artist' });
		album = await albumService.createAlbum(
			{ name: 'My Album', artist: { id: artist.id } },
			{ artist: true, releases: true }
		);
		compilationAlbum = await albumService.createAlbum(
			{ name: 'My Compilation' },
			{ artist: true, releases: true }
		);
	})

	it('should be defined', () => {
		expect(releaseService).toBeDefined();
	});
	
	describe('Create a release', () => {
		it("should create the album's first release", async () => {
			deluxeRelease = await releaseService.createRelease({
				title: 'My Album (Deluxe Edition)',
				album: { byId: { id: album.id } },
				releaseDate: new Date('2006'),
				master: true
			}, { album: true });
			expect(deluxeRelease.albumId).toBe(album.id);
			expect(deluxeRelease.master).toBeTruthy();
			expect(deluxeRelease.releaseDate).toStrictEqual(new Date('2006'));
			expect(deluxeRelease.title).toBe('My Album (Deluxe Edition)');
			expect(deluxeRelease.slug).toBe('my-album-deluxe-edition');
		});

		it("should create the album's first release (compilation)", async () => {
			compilationRelease = await releaseService.createRelease({
				title: 'My Compilation (Expanded Edition)',
				album: { byId: { id: compilationAlbum.id } },
				releaseDate: new Date('2005'),
				master: true
			}, { album: true });
			expect(compilationRelease.albumId).toBe(compilationAlbum.id);
			expect(compilationRelease.master).toBeTruthy();
			expect(compilationRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(compilationRelease.title).toBe('My Compilation (Expanded Edition)');
			expect(compilationRelease.slug).toBe('my-compilation-expanded-edition');
		});

		it("should update the parent album year", async () => {
			expect(deluxeRelease.album.name).toStrictEqual('My Album');
			expect(deluxeRelease.album.releaseDate).toStrictEqual(new Date('2006'));
		});
		
		it("should create the album's second release", async () => {
			album = await albumService.getAlbum(
				{ byId: { id: album.id } },
				{ releases: true, artist: true }
			);
			standardRelease = await releaseService.createRelease({
				title: 'My Album',
				album: { byId: { id: album.id } },
				releaseDate: new Date('2007'),
				master: false
			}, { album: true });
			expect(standardRelease.albumId).toBe(album.id);
			expect(standardRelease.master).toBeFalsy();
			expect(standardRelease.releaseDate).toStrictEqual(new Date('2007'));
			expect(standardRelease.title).toBe('My Album');
			expect(standardRelease.slug).toBe('my-album');
		});

		it("should not have updated the parent album metadata", async () => {
			expect(standardRelease.album.releaseDate).toStrictEqual(new Date('2006'));
			expect(standardRelease.album.name).toStrictEqual('My Album');
		});
	});

	describe('Get Releases', () => { 
		it("should get the releases", async () => {
			let releases = await releaseService.getReleases({}, {}, { album: true });
			expect(releases.length).toBe(3);
			expect(releases).toContainEqual(deluxeRelease);
			expect(releases).toContainEqual(standardRelease);
			expect(releases).toContainEqual(compilationRelease);
		});
	});

	describe('Get Releases', () => { 
		it("should get the releases, sorted by name", async () => {
			let releases = await releaseService.getReleases({}, {}, { album: true }, { sortBy: 'title', order: 'desc' });
			expect(releases.length).toBe(3);
			expect(releases[1]).toStrictEqual(deluxeRelease);
			expect(releases[2]).toStrictEqual(standardRelease);
			expect(releases[0]).toStrictEqual(compilationRelease);
		});
	});

	describe('Get Release', () => { 
		it("should get the release", async () => {
			let fetchedRelease = await releaseService.getRelease({
				bySlug: {
					slug: new Slug(deluxeRelease.slug),
					album: {
						bySlug: {
							slug: new Slug(deluxeRelease.album.slug),
							artist: { slug: new Slug(album.artist!.slug) }
						}
					},	
				}
			});
			expect(fetchedRelease.id).toBe(deluxeRelease.id);
			expect(fetchedRelease.albumId).toBe(deluxeRelease.albumId);
			expect(fetchedRelease.title).toBe(deluxeRelease.title);
			expect(fetchedRelease.releaseDate).toStrictEqual(deluxeRelease.releaseDate);
			expect(fetchedRelease.slug).toBe(deluxeRelease.slug);
			expect(fetchedRelease.master).toBe(deluxeRelease.master);
		});

		it("should get the release (compilation)", async () => {
			let fetchedRelease = await releaseService.getRelease({
				bySlug: {
					slug: new Slug('My Compilation (Expanded Edition)'),
					album: {
						bySlug: {
							slug: new Slug('My Compilation'),
						}
					},
				}
			});
			expect(fetchedRelease.id).toBe(compilationRelease.id);
			expect(fetchedRelease.albumId).toBe(compilationRelease.albumId);
			expect(fetchedRelease.title).toBe(compilationRelease.title);
			expect(fetchedRelease.releaseDate).toStrictEqual(compilationRelease.releaseDate);
			expect(fetchedRelease.slug).toBe(compilationRelease.slug);
			expect(fetchedRelease.master).toBe(compilationRelease.master);
		});

		it("should throw, as the release does not exists", async () => {
			const test = async () => {
				return await releaseService.getRelease({
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
				return await releaseService.getRelease({
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
			let fetchedRelease = await releaseService.getRelease({ byId: { id: deluxeRelease.id } });
			expect(fetchedRelease.id).toBe(deluxeRelease.id);
			expect(fetchedRelease.albumId).toBe(deluxeRelease.albumId);
			expect(fetchedRelease.title).toBe(deluxeRelease.title);
			expect(fetchedRelease.releaseDate).toStrictEqual(deluxeRelease.releaseDate);
			expect(fetchedRelease.slug).toBe(deluxeRelease.slug);
			expect(fetchedRelease.master).toBe(deluxeRelease.master);
		});

		it("should throw, as no release has the id", async () => {
			const test = async () => {
				return await releaseService.getRelease({ byId: { id: -1 } });
			}
			expect(test()).rejects.toThrow(ReleaseNotFoundFromIDException);
		});
	});

	describe('Get Master Release', () => {
		it("Should retrieve the master release", async () => {
			deluxeRelease = await releaseService.getRelease(
				{ byMasterOf: {
					bySlug: {
						slug: new Slug(album.slug),
						artist: { slug: new Slug(album.artist!.slug) }
					}
				}},
				{ album: true }
			);

			expect(deluxeRelease.albumId).toBe(album.id);
			expect(deluxeRelease.master).toBe(true);
			expect(deluxeRelease.title).toBe("My Album (Deluxe Edition)");
			expect(deluxeRelease.releaseDate).toStrictEqual(new Date('2006'));
		});

		it("Should retrieve the master release (compilation)", async () => {
			let compilationMaster = await releaseService.getRelease(
				{ byMasterOf: { bySlug: { slug: new Slug(compilationAlbum.slug) } }},
				{ album: true }
			);

			expect(compilationMaster.albumId).toBe(compilationAlbum.id);
			expect(compilationMaster.master).toBe(true);
			expect(compilationMaster.title).toBe("My Compilation (Expanded Edition)");
			expect(compilationMaster.releaseDate).toStrictEqual(new Date('2005'));
		});
	});

	describe('Update Release', () => {
		it("Should Update the release", async () => {
			let updatedRelease = await releaseService.updateRelease(
				{ title: 'My Album (Special Edition)' },
				{ byId: { id: deluxeRelease.id } }
			);
			expect(updatedRelease.id).toStrictEqual(deluxeRelease.id);
			expect(updatedRelease.albumId).toStrictEqual(deluxeRelease.albumId);
			expect(updatedRelease.title).toStrictEqual('My Album (Special Edition)');
			expect(updatedRelease.slug).toBe('my-album-special-edition');
		});

		it("Should Update the album's date", async () => {
			await releaseService.updateRelease(
				{ releaseDate: new Date('2005') },
				{ byId: { id: deluxeRelease.id } }
			);
			album = await albumService.getAlbum(
				{ bySlug: { slug: new Slug('My Album'), artist: { slug: new Slug ("My Artist") } } },
				{ releases: true }
			);
			expect(album.releaseDate).toStrictEqual(new Date('2005'));
		});

		it("Should Update the master release (unset)", async () => {
			await releaseService.updateRelease({ master: false }, { byId: { id: deluxeRelease.id } });
			album = await albumService.getAlbum(
				{ bySlug: { slug: new Slug('My Album'), artist: { slug: new Slug ("My Artist") } } },
				{ releases: true }
			);
			expect(album.releases.find((release) => release.master == true)!.id).toBe(standardRelease.id);
		});

		it("Should Update the master release (set)", async () => {
			await releaseService.updateRelease({ master: true }, { byId: { id: deluxeRelease.id } });
			let newMaster = await releaseService.getMasterRelease({ byId: { id: album.id } });
			expect(newMaster.title).toBe('My Album (Special Edition)');
			deluxeRelease = newMaster;
			let albumReleases = await releaseService.getAlbumReleases({ byId: { id: album.id } });
			expect(albumReleases.find((release) => release.master == false)!.title).toBe('My Album');

		});
	});

	describe('Find or create', () => {
		it("should retrieve the existing release", async () => {
			let fetchedRelease: Release = await releaseService.getOrCreateRelease({
				title: 'My Album (Special Edition)', album: { byId: { id: album.id } }, releaseDate: new Date('2008'), master: false
			});
			expect(fetchedRelease.id).toBe(deluxeRelease.id);
			expect(fetchedRelease.master).toBe(true);
			expect(fetchedRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(fetchedRelease.title).toBe("My Album (Special Edition)");
			expect(fetchedRelease.albumId).toBe(album.id);
			expect(fetchedRelease.slug).toBe('my-album-special-edition');
		});

		it("should create a new release", async () => {
			editedRelease = await releaseService.getOrCreateRelease({
				title: 'My Album (Edited Version)', album: { byId: { id: album.id } }, releaseDate: new Date('2007'), master: false
			});
			expect(editedRelease.albumId).toBe(album.id);
			expect(editedRelease.master).toBe(false);
			expect(editedRelease.releaseDate).toStrictEqual(new Date('2007'));
			expect(editedRelease.title).toBe("My Album (Edited Version)");
			expect(editedRelease.slug).toBe('my-album-edited-version');
		});
	});

	describe('Delete Release', () => {
		it("should delete only release, and parent album", async () => {
			await releaseService.deleteRelease({ byId: { id: compilationRelease.id } });
			const testRelease = async () => await releaseService.getRelease({ byId: { id: compilationRelease.id } });
			const testAlbum = async () => await albumService.getAlbum({ byId: { id: compilationAlbum.id } });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			expect(testAlbum()).rejects.toThrow(AlbumNotFoundFromIDException);
		});

		it("should delete a release (not master)", async () => {
			const queryParam = { byId: { id: editedRelease.id } };
			await releaseService.deleteRelease(queryParam);
			const testRelease = async () => await releaseService.getRelease(queryParam);
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			/// To check album still exists
			let master = await releaseService.getMasterRelease({ byId: { id: album.id } });
			expect(master.id).toBe(deluxeRelease.id);
		});

		it("should delete master release, and update master status", async () => {
			await releaseService.deleteRelease({ byId: { id: deluxeRelease.id } });
			const testRelease = async () => await releaseService.getRelease({ byId: { id: deluxeRelease.id } });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			let updatedSecondRelease =  await releaseService.getMasterRelease({ byId: { id: album.id } });
			expect(updatedSecondRelease.id).toBe(standardRelease.id);
		});

		it("should delete release, and parent album", async () => {
			await releaseService.deleteRelease({ byId: { id: standardRelease.id } });
			const testRelease = async () => await releaseService.getRelease({ byId: { id: standardRelease.id } });
			expect(testRelease()).rejects.toThrow(ReleaseNotFoundFromIDException);
			const testAlbum = async () => await albumService.getAlbum({ byId: { id: album.id } });
			expect(testAlbum()).rejects.toThrow(AlbumNotFoundFromIDException);
			const testArtist = async () => await artistService.getArtist({ id: artist.id  });
			expect(testArtist()).rejects.toThrow(ArtistNotFoundByIDException);
		});
	});
})