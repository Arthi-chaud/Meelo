import { Test, TestingModule } from "@nestjs/testing";
import { Album, Artist, Release } from "@prisma/client";
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
		album = await albumService.createAlbum('My Album', 'My Artist', undefined, {
			artist: true, releases: true
		});
	})

	it('should be defined', () => {
		expect(releaseService).toBeDefined();
	});

	describe('Create a release', () => {
		let release: Release & { album: Album };
		it("should create the album's first release", async () => {
			release = await releaseService.createRelease('My Album 1', album, new Date('2006'), {
				album: true
			});
			expect(release.albumId).toBe(album.id);
			expect(release.master).toBeTruthy();
			expect(release.releaseDate).toStrictEqual(new Date('2006'));
			expect(release.title).toBe('My Album 1');
		});

		it("should set the release date to the album", async () => {
			album = await albumService.getAlbum(new Slug(album.slug), new Slug(album.artist!.slug), {
				releases: true
			});
			expect(release.album.releaseDate).toStrictEqual(new Date('2006'));
		});

		it("should create the album's second release", async () => {
			release = await releaseService.createRelease('My Album 2', album, new Date('2007'), {
				album: true
			});
			expect(release.albumId).toBe(album.id);
			expect(release.master).toBeFalsy();
			expect(release.releaseDate).toStrictEqual(new Date('2007'));
			expect(release.title).toBe('My Album 2');
		});

		it("should not have set the release date of the album", async () => {
			expect(release.album.releaseDate).toStrictEqual(new Date('2006'));
		});
	});
})