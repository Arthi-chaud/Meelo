import { Test, TestingModule } from "@nestjs/testing";
import { Album, AlbumType, Artist, Release } from "@prisma/client";
import { AlbumNotFoundException } from "src/album/album.exceptions";
import { AlbumModule } from "src/album/album.module";
import { AlbumService } from "src/album/album.service";
import { ArtistNotFoundException } from "src/artist/artist.exceptions";
import { ArtistModule } from "src/artist/artist.module";
import { ArtistService } from "src/artist/artist.service";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { Slug } from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { ReleaseNotFoundException, ReleaseNotFoundFromIDException } from "./release.exceptions";
import { ReleaseService } from "./release.service";

describe('Release Service', () => {
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	let album: Album & { releases: Release[], artist: Artist | null };
	let compilationAlbum: Album & { releases: Release[], artist: Artist | null };
	let release: Release & { album: Album };
	let compilationRelease: Release;
	
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule],
			providers: [ReleaseService, AlbumService, ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		let artist = await module.get<ArtistService>(ArtistService).createArtist({ name: 'My Artist' });
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

	describe('Build Album Name from release\'s', () => {
		it("should build the album name from a basic release name", () => {
			expect(releaseService.removeReleaseExtension('My Album')).toBe('My Album');
			expect(releaseService.removeReleaseExtension("My New Album")).toBe('My New Album');
		});

		it("should build the album name from a release name with a basic extension", () => {
			expect(releaseService.removeReleaseExtension('My Album (Deluxe Edition)')).toBe('My Album');
			expect(releaseService.removeReleaseExtension("My New Album (Edited Special Edition)")).toBe('My New Album');
		});

		it("should build the album name from a release name with a medium extension", () => {
			expect(releaseService.removeReleaseExtension('Garbage (20th Anniversary Deluxe Edition)')).toBe('Garbage');
		});

		it("should build the album name from a release name with a suffix ", () => {
			expect(releaseService.removeReleaseExtension('My Album (Right Now)')).toBe('My Album (Right Now)');
		});

		it("should build the album name from a release name with a prefix ", () => {
			expect(releaseService.removeReleaseExtension('(Right Now) My Album')).toBe('(Right Now) My Album');
		});

		it("should build the album name from a release name with a basic extension and a suffix ", () => {
			expect(releaseService.removeReleaseExtension('My Album (Right Now) [Deluxe Edition]')).toBe('My Album (Right Now)');
		});

		it("should build the album name from a release name with a basic extension and a prefix ", () => {
			expect(releaseService.removeReleaseExtension('(Right Now) My Album [Deluxe Edition]')).toBe('(Right Now) My Album');
		});
	});
	
	describe('Create a release', () => {
		it("should create the album's first release", async () => {
			release = await releaseService.createRelease('My Album (Deluxe Edition)', album, new Date('2006'), {
				album: true
			});
			expect(release.albumId).toBe(album.id);
			expect(release.master).toBeTruthy();
			expect(release.releaseDate).toStrictEqual(new Date('2006'));
			expect(release.title).toBe('My Album (Deluxe Edition)');
			expect(release.slug).toBe('my-album-deluxe-edition');
		});

		it("should create the album's first release (compilation)", async () => {
			compilationRelease = await releaseService.createRelease('My Compilation (Expanded Edition)', compilationAlbum, new Date('2005'), {
				album: true
			});
			expect(compilationRelease.albumId).toBe(compilationAlbum.id);
			expect(compilationRelease.master).toBeTruthy();
			expect(compilationRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(compilationRelease.title).toBe('My Compilation (Expanded Edition)');
			expect(compilationRelease.slug).toBe('my-compilation-expanded-edition');
		});

		it("should update the parent album year", async () => {
			expect(release.album.name).toStrictEqual('My Album');
			expect(release.album.releaseDate).toStrictEqual(new Date('2006'));
		});
		
		it("should create the album's second release", async () => {
			album = await albumService.getAlbum(
				{ byId: { id: album.id } },
				{ releases: true, artist: true }
			);
			release = await releaseService.createRelease('My Album', album, new Date('2007'), {
				album: true
			});
			expect(release.albumId).toBe(album.id);
			expect(release.master).toBeFalsy();
			expect(release.releaseDate).toStrictEqual(new Date('2007'));
			expect(release.title).toBe('My Album');
			expect(release.slug).toBe('my-album');
		});

		it("should not have updated the parent album metadata", async () => {
			expect(release.album.releaseDate).toStrictEqual(new Date('2006'));
			expect(release.album.name).toStrictEqual('My Album');
		});
	});

	describe('Get Release', () => { 
		it("should get the release", async () => {
			let fetchedRelease = await releaseService.getRelease({
				bySlug: {
					slug: new Slug(release.slug),
					albumSlug: new Slug(release.album.slug),
					artistSlug: new Slug(album.artist!.slug)
				}
			});
			expect(fetchedRelease.id).toBe(release.id);
			expect(fetchedRelease.albumId).toBe(release.albumId);
			expect(fetchedRelease.title).toBe(release.title);
			expect(fetchedRelease.releaseDate).toStrictEqual(release.releaseDate);
			expect(fetchedRelease.slug).toBe(release.slug);
			expect(fetchedRelease.master).toBe(release.master);
		});

		it("should get the release (compilation)", async () => {
			let fetchedRelease = await releaseService.getRelease({
				bySlug: {
					slug: new Slug('My Compilation (Expanded Edition)'),
					albumSlug: new Slug('My Compilation')
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
						albumSlug: new Slug('I dont either')
					}
				});
			}
			expect(test()).rejects.toThrow(ReleaseNotFoundException);
		});

		it("should get the release from its id", async () => {
			let fetchedRelease = await releaseService.getRelease({ byId: { id: release.id } });
			expect(fetchedRelease.id).toBe(release.id);
			expect(fetchedRelease.albumId).toBe(release.albumId);
			expect(fetchedRelease.title).toBe(release.title);
			expect(fetchedRelease.releaseDate).toStrictEqual(release.releaseDate);
			expect(fetchedRelease.slug).toBe(release.slug);
			expect(fetchedRelease.master).toBe(release.master);
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
			release = await releaseService.getRelease(
				{ byMasterOfNamedAlbum: {
					albumSlug: new Slug(album.slug),
					artistSlug: new Slug(album.artist!.slug)
				}},
				{ album: true }
			);

			expect(release.albumId).toBe(album.id);
			expect(release.master).toBe(true);
			expect(release.title).toBe("My Album (Deluxe Edition)");
			expect(release.releaseDate).toStrictEqual(new Date('2006'));
		});

		it("Should retrieve the master release (compilation)", async () => {
			let compilationMaster = await releaseService.getRelease(
				{ byMasterOfNamedAlbum: { albumSlug: new Slug(compilationAlbum.slug) } },
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
			release.title = 'My Album (Special Edition)';

			let updatedRelease = await releaseService.updateRelease(release);
			expect(updatedRelease.id).toStrictEqual(release.id);
			expect(updatedRelease.albumId).toStrictEqual(release.albumId);
			expect(updatedRelease.title).toStrictEqual(release.title);
			expect(updatedRelease.slug).toBe('my-album-special-edition');
		});

		it("Should Update the album's date", async () => {
			release.releaseDate = new Date('2005');

			await releaseService.updateRelease(release);
			album = await albumService.getAlbum(
				{ bySlug: { slug: new Slug('My Album'), artist: { slug: new Slug ("My Artist") } } },
				{ releases: true }
			);
			expect(album.releaseDate).toStrictEqual(new Date('2005'));
		});

		it("Should Update the master release", async () => {
			release.master = false;

			await releaseService.updateRelease(release);
			album = await albumService.getAlbum(
				{ bySlug: { slug: new Slug('My Album'), artist: { slug: new Slug ("My Artist") } } },
				{ releases: true }
			);
			expect(album.releases.find((release) => release.master == true)!.title).toBe('My Album');
		});
	});

	describe('Find or create', () => {
		it("should retrieve the existing release (Album name not provided)", async () => {
			let fetchedRelease: Release = await releaseService.findOrCreateRelease('My Album (Special Edition)', undefined, 'My Artist', new Date('2008'));
			expect(fetchedRelease.id).toBe(release.id);
			expect(fetchedRelease.master).toBe(false);
			expect(fetchedRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(fetchedRelease.title).toBe("My Album (Special Edition)");
			expect(fetchedRelease.albumId).toBe(album.id);
			expect(fetchedRelease.slug).toBe('my-album-special-edition');
		});

		it("should create a new release", async () => {
			let createdRelease: Release = await releaseService.findOrCreateRelease('My Album (Edited Version)', undefined, 'My Artist', new Date('2007'));
			expect(createdRelease.albumId).toBe(album.id);
			expect(createdRelease.master).toBe(false);
			expect(createdRelease.releaseDate).toStrictEqual(new Date('2007'));
			expect(createdRelease.title).toBe("My Album (Edited Version)");
			expect(createdRelease.slug).toBe('my-album-edited-version');
		});

		it("should throw, as the parent artist does not exist", async () => {
			const test = async () => {
				await releaseService.findOrCreateRelease('My New Album (Live) [Deluxe]', undefined, 'My New Artist', new Date('2007'), {
					album: true
				});
			}
			expect(test()).rejects.toThrow(ArtistNotFoundException);
		});
	});
})