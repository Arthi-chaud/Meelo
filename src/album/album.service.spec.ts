import { AlbumService } from "./album.service";
import { Album, AlbumType } from "@prisma/client";
import { ArtistService } from "src/artist/artist.service";
import { Test, TestingModule } from "@nestjs/testing";
import { ArtistModule } from "src/artist/artist.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { AlbumModule } from "./album.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { PrismaService } from "src/prisma/prisma.service";
import { AlbumAlreadyExistsException } from "./album.exceptions";
import { Slug } from "src/slug/slug";

describe('Album Service', () => {
	let albumService: AlbumService;
	let artistService: ArtistService;
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AlbumModule, ArtistModule, PrismaModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
	})

	it('should be defined', () => {
		expect(artistService).toBeDefined();
		expect(albumService).toBeDefined();
	});

	describe('Detect Album Type', () => {

		it('should says its a studio album', () => {
			expect(AlbumService.getAlbumTypeFromName('Into the Skyline')).toBe(AlbumType.StudioRecording);
			expect(AlbumService.getAlbumTypeFromName('Celebration')).toBe(AlbumType.StudioRecording);
			expect(AlbumService.getAlbumTypeFromName('Living Room')).toBe(AlbumType.StudioRecording);
		});

		it('should says its a live album', () => {
			expect(AlbumService.getAlbumTypeFromName('Intimate & Live')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('Some Album (Live)')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('11,000 Click (Live at Brixton)')).toBe(AlbumType.LiveRecording);
		});

		it('should says its a live album', () => {
			expect(AlbumService.getAlbumTypeFromName('Happy BusDay: Best of Superbys')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Very Best of Moby')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Best Mixes From The Album Debut')).toBe(AlbumType.Compilation);
		});

		it('should says its a single', () => {
			expect(AlbumService.getAlbumTypeFromName('Twist - Single')).toBe(AlbumType.Single);
			expect(AlbumService.getAlbumTypeFromName('Falling (Remixes)')).toBe(AlbumType.Single);
		});
	});

	describe('Create an album', () => {
		describe('No artist', () => {
			it('should create an album (no artist)', async () => {
				let album: Album = await albumService.createAlbum('My album');

				expect(album.id).toBeDefined();
				expect(album.artistId).toBeNull();
				expect(album.releaseDate).toBeNull();
				expect(album.slug.toString()).toBe('my-album');
				expect(album.type).toBe(AlbumType.StudioRecording);
			});

			it('should throw, as an album with the same name exists (no artist)', () => {
				const test = async () => {
					return await albumService.createAlbum('My album');
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsException);
			});
		});

		describe('With artist', () => {
			it('should create a live album', async () => {
				let album = await albumService.createAlbum('My album (Live)', 'My Artist', new Date('2006'), {
					artist: true
				});

				expect(album.id).toBeDefined();
				expect(album.artist!.name).toBe('My Artist');
				expect(album.releaseDate).toStrictEqual(new Date('2006'));
				expect(album.name).toBe('My album (Live)');
				expect(album.slug.toString()).toBe('my-album-live');
				expect(album.type).toBe(AlbumType.LiveRecording);
			});

			it('should throw, as an album with the same name exists', () => {
				const test = async () => {
					return await albumService.createAlbum('My album (Live)', 'My Artist');
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsException);
			});
		});
	});

	describe('Get an album', () => {
		it("should find the album (w/o artist, but included)", async () => {
			let album = await albumService.getAlbum(new Slug('My album'), undefined, {
				artist: true
			});
			expect(album.id).toBeDefined();
			expect(album.artist).toBeNull();
			expect(album.artistId).toBeNull();
			expect(album.releaseDate).toBeNull();
			expect(album.slug.toString()).toBe('my-album');
			expect(album.type).toBe(AlbumType.StudioRecording);
		});

		it("should find the album (w/ artist)", async () => {
			let album = await albumService.getAlbum(new Slug('My album (Live)'),  new Slug('My Artist'), {
				artist: true
			});
			expect(album.id).toBeDefined();
			expect(album.artist!.name).toBe('My Artist');
			expect(album.releaseDate).toStrictEqual(new Date('2006'));
			expect(album.name).toBe('My album (Live)');
			expect(album.slug.toString()).toBe('my-album-live');
			expect(album.type).toBe(AlbumType.LiveRecording);
		})
	});

	describe('Update an album', () => { 
		it('should change the information of the album in the database', async () => {
			let album = await albumService.getAlbum(new Slug('My album'));
			album.name = "My new album";
			expect((await albumService.updateAlbum(album)).slug.toString()).toBe('my-new-album');
			let updatedAlbum = await albumService.getAlbum(new Slug('My new album'));
			
			expect(updatedAlbum.id).toBe(album.id);
		});
	});

	describe('Find or create', () => {
		it("should find the existing album (no artist)", async () => {
			let album = await albumService.getAlbum(new Slug('My new album'));
			let fetchedAlbum = await albumService.findOrCreate('My new album');

			expect(fetchedAlbum.id).toBe(album.id);
			expect(fetchedAlbum.name).toBe(album.name);
			expect(fetchedAlbum.slug).toBe(album.slug);
		});

		it("should find the existing album (w/ artist)", async () => {
			let album = await albumService.getAlbum(new Slug('My album (Live)'), new Slug('My Artist'));
			let fetchedAlbum = await albumService.findOrCreate('My album (Live)', 'My Artist');

			expect(fetchedAlbum.id).toBe(album.id);
			expect(fetchedAlbum.name).toBe(album.name);
			expect(fetchedAlbum.slug).toBe(album.slug);
		});

		it("should create a new album", async () => {
			let albumNoArtist = await albumService.getAlbum(new Slug('My new album'));
			let albumWithArtist = await albumService.getAlbum(new Slug('My album (Live)'), new Slug('My Artist'));
			let newAlbum = await albumService.findOrCreate('My brand new album', 'My Artist');
			
			expect(newAlbum.id).toBeGreaterThan(albumNoArtist.id);
			expect(newAlbum.id).toBeGreaterThan(albumWithArtist.id);
			expect(newAlbum.artistId).toBe(albumWithArtist.artistId);
		});
	});
});