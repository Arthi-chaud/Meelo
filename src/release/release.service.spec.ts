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
		album = await albumService.createAlbum('My Album (Deluxe Edition)', 'My Artist', undefined, {
			artist: true, releases: true
		});
	})

	it('should be defined', () => {
		expect(releaseService).toBeDefined();
	});
	
	describe('Create a release', () => {
		it("should create the album's first release", async () => {
			release = await releaseService.createRelease('My Album', album, new Date('2006'), {
				album: true
			});
			expect(release.albumId).toBe(album.id);
			expect(release.master).toBeTruthy();
			expect(release.releaseDate).toStrictEqual(new Date('2006'));
			expect(release.title).toBe('My Album');
		});

		it("should update the parent album data", async () => {
			const test = async () => {
				return await albumService.getAlbum(new Slug(album.slug), new Slug(album.artist!.slug));
			}
			expect(test()).rejects.toThrow(AlbumNotFoundException);
			expect(release.album.name).toStrictEqual('My Album');
			expect(release.album.releaseDate).toStrictEqual(new Date('2006'));
		});
		
		it("should create the album's second release", async () => {
			album = await albumService.getAlbum(new Slug('My Album'), new Slug(album.artist!.slug), {
				releases: true, artist :true
			});
			release = await releaseService.createRelease('My Album (Special Edition)', album, new Date('2007'), {
				album: true
			});
			expect(release.albumId).toBe(album.id);
			expect(release.master).toBeFalsy();
			expect(release.releaseDate).toStrictEqual(new Date('2007'));
			expect(release.title).toBe('My Album (Special Edition)');
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
			expect(release.title).toBe("My Album");
			expect(release.releaseDate).toStrictEqual(new Date('2006'));
		});
	});

	describe('Update Release', () => {
		it("Should Update the release", async () => {
			release.title = 'My Album 2';

			let updatedRelease = await releaseService.updateRelease(release);
			expect(updatedRelease.id).toStrictEqual(release.id);
			expect(updatedRelease.albumId).toStrictEqual(release.albumId);
			expect(updatedRelease.title).toStrictEqual(release.title);
		});

		it("Should Update the name of the parent album", async () => {
			release.title = 'My Albu';

			await releaseService.updateRelease(release);
			album = await albumService.getAlbum(new Slug('My Albu'), new Slug ("My Artist"), {
				releases: true, artist: true
			});
			expect(album.name).toBe('My Albu');
			expect(album.artist!.name).toBe('My Artist');
			expect(album.releases.map((release) => release.id)).toContain(release.id);
		});

		it("Should Update the album's date", async () => {
			release.releaseDate = new Date('2005');

			await releaseService.updateRelease(release);
			album = await albumService.getAlbum(new Slug('My Albu'), new Slug ("My Artist"), {
				releases: true
			});
			expect(album.releaseDate).toStrictEqual(new Date('2005'));
		});

		it("Should Update the master release", async () => {
			release.master = false;

			await releaseService.updateRelease(release);
			album = await albumService.getAlbum(new Slug('My Albu'), new Slug ("My Artist"), {
				releases: true
			});
			expect(album.releases.find((release) => release.master == true)!.title).toBe('My Album (Special Edition)');
		});
	});

	describe('Find or create', () => {
		it("should retrieve the existing release", async () => {
			let fetchedRelease: Release = await releaseService.findOrCreateRelease('My Albu', 'My Albu', 'My Artist', new Date('2008'));
			expect(fetchedRelease.id).toBe(release.id);
			expect(fetchedRelease.master).toBe(false);
			expect(fetchedRelease.releaseDate).toStrictEqual(new Date('2005'));
			expect(fetchedRelease.title).toBe("My Albu");
		});

		it("should create a new release", async () => {
			let createdRelease: Release = await releaseService.findOrCreateRelease('My Album', 'My Albu', 'My Artist', new Date('2007'));
			expect(createdRelease.albumId).toBe(album.id);
			expect(createdRelease.master).toBe(false);
			expect(createdRelease.releaseDate).toStrictEqual(new Date('2007'));
			expect(createdRelease.title).toBe("My Album");
		});

		it("should create a new release for a new album", async () => {
			let createdRelease = await releaseService.findOrCreateRelease('My New Album (Live)', 'My New Album (Live)', 'My New Artist', new Date('2007'), {
				album: true
			});

			expect(createdRelease.releaseDate).toStrictEqual(new Date('2007'));
			expect(createdRelease.master).toBe(true);
			expect(createdRelease.title).toBe('My New Album (Live)');
			expect(createdRelease.album.id).toBe(createdRelease.albumId);
			expect(createdRelease.album.name).toBe("My New Album (Live)");
			expect(createdRelease.album.releaseDate).toStrictEqual(new Date('2007'));
			expect(createdRelease.album.type).toBe(AlbumType.LiveRecording);
			expect(createdRelease.album.slug).toBe('my-new-album-live');
		});
	});
})