import AlbumService from "./album.service";
import { Album, AlbumType } from "@prisma/client";
import ArtistService from "src/artist/artist.service";
import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import AlbumModule from "./album.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import PrismaService from "src/prisma/prisma.service";
import { AlbumAlreadyExistsException, AlbumNotFoundFromIDException } from "./album.exceptions";
import Slug from "src/slug/slug";
import { ArtistNotFoundException } from "src/artist/artist.exceptions";
import SongModule from "src/song/song.module";

describe('Album Service', () => {
	let albumService: AlbumService;
	let artistService: ArtistService;
	let album: Album;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [AlbumModule, ArtistModule, PrismaModule, SongModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
		await artistService.createArtist({ name: 'My Artist' });
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
				album = await albumService.createAlbum({ name: 'My album' });

				expect(album.id).toBeDefined();
				expect(album.artistId).toBeNull();
				expect(album.releaseDate).toBeNull();
				expect(album.slug.toString()).toBe('my-album');
				expect(album.type).toBe(AlbumType.StudioRecording);
			});

			it('should throw, as an album with the same name exists (no artist)', () => {
				const test = async () => {
					return await albumService.createAlbum({ name: 'My Album' });
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsException);
			});
		});

		describe('With artist', () => {
			it('should create a live album', async () => {
				let album = await albumService.createAlbum({
					name: 'My album (Live)',
					artist: { slug: new Slug("My Artist") },
					releaseDate: new Date('2006')
				}, { releases: true, artist: true });
				expect(album.id).toBeDefined();
				expect(album.artist!.name).toBe('My Artist');
				expect(album.releaseDate).toStrictEqual(new Date('2006'));
				expect(album.name).toBe('My album (Live)');
				expect(album.slug.toString()).toBe('my-album-live');
				expect(album.type).toBe(AlbumType.LiveRecording);
				expect(album.releases).toStrictEqual([]);
			});

			it('should throw, as an album with the same name exists', () => {
				const test = async () => {
					return await albumService.createAlbum({
						name: 'My album (Live)',
						artist: { slug: new Slug('My Artist') }
					});
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsException);
			});

			it('should throw, as the related artist does not exists', () => {
				const test = async () => {
					return await albumService.createAlbum({
						name: 'My album (Live)',
						artist: { slug: new Slug('I do not exists') }
					});
				}
				expect(test()).rejects.toThrow(ArtistNotFoundException);
			});
		});
	});

	describe('Get an album', () => {
		it("should find the album (w/o artist, but included)", async () => {
			let album = await albumService.getAlbum(
				{ bySlug: { slug: new Slug('My album'), artist: undefined } }, 
				{ artist: true }
			);
			expect(album.id).toBeDefined();
			expect(album.artist).toBeNull();
			expect(album.artistId).toBeNull();
			expect(album.releaseDate).toBeNull();
			expect(album.slug.toString()).toBe('my-album');
			expect(album.type).toBe(AlbumType.StudioRecording);
		});

		it("should find the album (w/ artist)", async () => {
			let album = await albumService.getAlbum(
				{ bySlug: { slug: new Slug('My album (Live)'), artist: { slug: new Slug('My Artist') }} }, 
				{ artist: true, releases: true }
			);
			expect(album.id).toBeDefined();
			expect(album.artist!.name).toBe('My Artist');
			expect(album.releaseDate).toStrictEqual(new Date('2006'));
			expect(album.name).toBe('My album (Live)');
			expect(album.slug.toString()).toBe('my-album-live');
			expect(album.type).toBe(AlbumType.LiveRecording);
			expect(album.releases).toStrictEqual([]);
		})
	});

	describe('Update an album', () => { 
		it('should change the information of the album in the database', async () => {
			let album = await albumService.getAlbum({
				bySlug: { slug: new Slug('My album') }
			});
			album.name = "My new album";
			expect((await albumService.updateAlbum(album, { byId: { id: album.id } })).slug.toString()).toBe('my-new-album');
			let updatedAlbum = await albumService.getAlbum({
				bySlug: { slug: new Slug('My new album') }
			});
			
			expect(updatedAlbum.id).toBe(album.id);
		});
	});

	describe('Find or create', () => {
		it("should find the existing album (no artist)", async () => {
			let album = await albumService.getAlbum({
				bySlug: { slug: new Slug('My new album') }
			});
			let fetchedAlbum = await albumService.getOrCreateAlbum({
				name: 'My new album'
			});

			expect(fetchedAlbum.id).toBe(album.id);
			expect(fetchedAlbum.name).toBe(album.name);
			expect(fetchedAlbum.slug).toBe(album.slug);
		});

		it("should find the existing album (w/ artist)", async () => {
			let album = await albumService.getAlbum({
				bySlug: { slug: new Slug('My album (Live)'), artist: { slug: new Slug('My Artist') } }
			});
			let fetchedAlbum = await albumService.getOrCreateAlbum({
				name: 'My album (Live)',
				artist: { slug: new Slug('My Artist') },
			});

			expect(fetchedAlbum.id).toBe(album.id);
			expect(fetchedAlbum.name).toBe(album.name);
			expect(fetchedAlbum.slug).toBe(album.slug);
		});

		it("should create a new album", async () => {
			let albumNoArtist = await albumService.getAlbum({
				bySlug: { slug: new Slug('My new album') }
			});
			let albumWithArtist = await albumService.getAlbum({
				bySlug: { slug: new Slug('My album (Live)'), artist: { slug: new Slug('My Artist') } }
			});
			let newAlbum = await albumService.getOrCreateAlbum({
				name: 'My brand new album',
				artist: { slug: new Slug('My Artist') },
			});
			
			expect(newAlbum.id).toBeGreaterThan(albumNoArtist.id);
			expect(newAlbum.id).toBeGreaterThan(albumWithArtist.id);
			expect(newAlbum.artistId).toBe(albumWithArtist.artistId);
		});
	});

	describe('Delete Album', () => {
		it("should throw, as the album does not exist (by id)", () => {
			const test = async () => albumService.deleteAlbum({ byId: { id: -1 } });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException); 
		});

		it("should delete the album", async () => {
			const albumQueryParameters = { byId: { id: album.id } };
			await albumService.deleteAlbum(albumQueryParameters);
			const test = async () => albumService.getAlbum(albumQueryParameters);
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException); 
		});
	});
});