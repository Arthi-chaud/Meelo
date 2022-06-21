import { Test, TestingModule } from "@nestjs/testing";
import { Album, AlbumType, Artist, Release } from "@prisma/client";
import { AlbumNotFoundException } from "src/album/album.exceptions";
import { AlbumModule } from "src/album/album.module";
import { AlbumService } from "src/album/album.service";
import { ArtistModule } from "src/artist/artist.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { Slug } from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { ReleaseService } from "./release.service";

describe('Release Service', () => {
	let releaseService: ReleaseService;
	let albumService: AlbumService;
	let album: Album & { releases: Release[], artist: Artist | null };
	let release: Release & { album: Album };
	
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [PrismaModule, AlbumModule, AlbumModule, ArtistModule],
			providers: [ReleaseService, AlbumService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		releaseService = module.get<ReleaseService>(ReleaseService);
		albumService = module.get<AlbumService>(AlbumService);
		album = await albumService.createAlbum('My Album', 'My Artist', undefined, {
			artist: true, releases: true
		});
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

		it("should update the parent album year", async () => {
			expect(release.album.name).toStrictEqual('My Album');
			expect(release.album.releaseDate).toStrictEqual(new Date('2006'));
		});
		
		it("should create the album's second release", async () => {
			album = await albumService.getAlbumFromID(album.id, {
				releases: true, artist: true
			});
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

	describe('Get Master Release', () => {
		it("Should retrieve the master release", async () => {
			release = await releaseService.getMasterReleaseOf(new Slug(album.slug), new Slug(album.artist!.slug), {
				album: true, 
			});

			expect(release.albumId).toBe(album.id);
			expect(release.master).toBe(true);
			expect(release.title).toBe("My Album (Deluxe Edition)");
			expect(release.releaseDate).toStrictEqual(new Date('2006'));
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
			album = await albumService.getAlbum(new Slug('My Album'), new Slug ("My Artist"), {
				releases: true
			});
			expect(album.releaseDate).toStrictEqual(new Date('2005'));
		});

		it("Should Update the master release", async () => {
			release.master = false;

			await releaseService.updateRelease(release);
			album = await albumService.getAlbum(new Slug('My Album'), new Slug ("My Artist"), {
				releases: true
			});
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

		it("should create a new release for a new album (No album name provided)", async () => {
			let createdRelease = await releaseService.findOrCreateRelease('My New Album (Live) [Deluxe]', undefined, 'My New Artist', new Date('2007'), {
				album: true
			});

			expect(createdRelease.releaseDate).toStrictEqual(new Date('2007'));
			expect(createdRelease.master).toBe(true);
			expect(createdRelease.title).toBe('My New Album (Live) [Deluxe]');
			expect(createdRelease.slug).toBe('my-new-album-live-deluxe');
			expect(createdRelease.album.id).toBe(createdRelease.albumId);
			expect(createdRelease.album.name).toBe("My New Album (Live)");
			expect(createdRelease.album.releaseDate).toStrictEqual(new Date('2007'));
			expect(createdRelease.album.type).toBe(AlbumType.LiveRecording);
			expect(createdRelease.album.slug).toBe('my-new-album-live');
		});
	});
})