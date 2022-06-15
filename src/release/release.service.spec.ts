import { Test, TestingModule } from "@nestjs/testing";
import { Album, Artist, Release } from "@prisma/client";
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
		let release: Release & { album: Album };
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
				releases: true
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
})