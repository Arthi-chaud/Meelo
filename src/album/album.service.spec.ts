import AlbumService from "./album.service";
import { Album, AlbumType } from "@prisma/client";
import ArtistService from "src/artist/artist.service";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import AlbumModule from "./album.module";
import FileManagerService from "src/file-manager/file-manager.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import PrismaService from "src/prisma/prisma.service";
import { AlbumAlreadyExistsException, AlbumAlreadyExistsExceptionWithArtistID, AlbumNotFoundFromIDException } from "./album.exceptions";
import Slug from "src/slug/slug";
import { ArtistNotFoundByIDException, ArtistNotFoundException } from "src/artist/artist.exceptions";
import SongModule from "src/song/song.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import SongService from "src/song/song.service";

describe('Album Service', () => {
	let albumService: AlbumService;
	let artistService: ArtistService;
	let songService: SongService;
	let newAlbum: Album;
	let newCompilationAlbum: Album;
	let dummyRepository: TestPrismaService;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [AlbumModule, ArtistModule, PrismaModule, SongModule, IllustrationModule, GenreModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
		songService = module.get(SongService);
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
				newCompilationAlbum = await albumService.create({ name: 'My Other Compilation Album' });

				expect(newCompilationAlbum.id).toBeDefined();
				expect(newCompilationAlbum.artistId).toBeNull();
				expect(newCompilationAlbum.releaseDate).toBeNull();
				expect(newCompilationAlbum.slug).toBe('my-other-compilation-album');
				expect(newCompilationAlbum.type).toBe(AlbumType.StudioRecording);
			});

			it('should throw, as an album with the same name exists (no artist)', () => {
				const test = async () => {
					return await albumService.create({ name: dummyRepository.compilationAlbumA.name });
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsException);
			});

			it('should throw, as an album with the same name exists (w/ artist)', () => {
				const test = async () => {
					return await albumService.create({
						name: dummyRepository.albumA1.name,
						artist: { id: dummyRepository.artistA.id }
					});
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsExceptionWithArtistID);
			});
		});

		describe('With artist', () => {
			it('should create a live album', async () => {
				newAlbum = await albumService.create({
					name: 'My Live Album',
					artist: { slug: new Slug(dummyRepository.artistA.slug) },
					releaseDate: new Date('2006')
				});
				expect(newAlbum.id).toBeDefined();
				expect(newAlbum.artistId).toBe(dummyRepository.artistA.id);
				expect(newAlbum.releaseDate).toStrictEqual(new Date('2006'));
				expect(newAlbum.name).toBe('My Live Album');
				expect(newAlbum.slug).toBe('my-live-album');
				expect(newAlbum.type).toBe(AlbumType.LiveRecording);
			});

			it('should throw, as an album with the same name exists', () => {
				const test = async () => {
					return await albumService.create({
						name: dummyRepository.albumA1.name,
						artist: { id: dummyRepository.artistA.id }
					});
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsExceptionWithArtistID);
			});

			it('should throw, as the related artist does not exists', () => {
				const test = async () => {
					return await albumService.create({
						name: 'My album (Live)',
						artist: { slug: new Slug('I do not exists') }
					});
				}
				expect(test()).rejects.toThrow(ArtistNotFoundException);
			});
		});
	});

	describe('Get albums', () => {
		it("should find all the albums", async () => {
			let albums = await albumService.getMany({});
			expect(albums.length).toBe(5);
			expect(albums).toContainEqual(dummyRepository.albumA1);
			expect(albums).toContainEqual(dummyRepository.albumB1);
			expect(albums).toContainEqual(dummyRepository.compilationAlbumA);
			expect(albums).toContainEqual(newAlbum);
			expect(albums).toContainEqual(newCompilationAlbum);
		});

		it("should find some albums w/ pagination", async () => {
			let albums = await albumService.getMany({}, { take: 2, skip: 2 });
			expect(albums.length).toBe(2);
			expect(albums[0]).toStrictEqual(dummyRepository.compilationAlbumA);
			expect(albums[1]).toStrictEqual(newCompilationAlbum);
		});

		it("should sort the albums", async () => {
			let albums = await albumService.getMany({}, {}, {}, { sortBy: 'name', order: 'desc' });
			expect(albums.length).toBe(5);
			expect(albums[0]).toStrictEqual(dummyRepository.albumB1);
			expect(albums[1]).toStrictEqual(newCompilationAlbum);
			expect(albums[2]).toStrictEqual(newAlbum);
			expect(albums[3]).toStrictEqual(dummyRepository.compilationAlbumA);
			expect(albums[4]).toStrictEqual(dummyRepository.albumA1);
		});
	});

	describe('Get an album', () => {
		it("should find the album (w/o artist)", async () => {
			let album = await albumService.get(
				{ bySlug: { slug: new Slug(dummyRepository.compilationAlbumA.slug), artist: undefined } }, 
			);
			expect(album).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should find the album (w/ artist)", async () => {
			let album = await albumService.get(
				{ bySlug: { slug: new Slug(dummyRepository.albumA1.slug), artist: { slug: new Slug(dummyRepository.artistA.slug) }} }, 
			);
			expect(album).toStrictEqual(dummyRepository.albumA1);
		});

		it("should find the album (by id)", async () => {
			let album = await albumService.get(
				{ byId: { id: dummyRepository.albumB1.id } }, 
			);
			expect(album).toStrictEqual(dummyRepository.albumB1);
		})
	});

	describe('Update an album', () => { 
		it('should change the information of the album in the database', async () => {
			let updatedAlbum = await albumService.update(
				{ name: 'My Album Live'},
				{ byId: { id: newAlbum.id } }
			);
			expect(updatedAlbum).toStrictEqual({
				...newAlbum,
				name: 'My Album Live',
				slug: 'my-album-live'
			});
		});
	});

	describe('Find or create', () => {
		it("should find the existing album (no artist)", async () => {
			let fetchedAlbum = await albumService.getOrCreate({
				name: dummyRepository.compilationAlbumA.name
			});

			expect(fetchedAlbum).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should find the existing album (w/ artist)", async () => {
			let fetchedAlbum = await albumService.getOrCreate({
				name: dummyRepository.albumB1.name,
				artist: { slug: new Slug(dummyRepository.artistB.slug) }
			});

			expect(fetchedAlbum).toStrictEqual(dummyRepository.albumB1);
		});

		it("should create a new album", async () => {
			let otherAlbum = await albumService.getOrCreate({
				name: 'My Third Compilation Album'
			});
			
			expect(otherAlbum.artistId).toBeNull();
			expect(otherAlbum).not.toStrictEqual(newCompilationAlbum);
			expect(otherAlbum).not.toStrictEqual(dummyRepository.compilationAlbumA);
		});
	});

	describe('Delete Album', () => {
		it("should throw, as the album does not exist (by id)", () => {
			const test = async () => albumService.delete({ byId: { id: -1 } });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException); 
		});

		it("should delete the album", async () => {
			const albumQueryParameters = { byId: { id: dummyRepository.compilationAlbumA.id } };
			await albumService.delete(albumQueryParameters);
			const test = async () => albumService.get(albumQueryParameters);
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException); 
		});

		it("should delete the album and the parent artist", async () => {
			const albumQueryParameters = { byId: { id: dummyRepository.albumB1.id } };
			await albumService.delete(albumQueryParameters);
			await songService.delete({ byId: { id: dummyRepository.songB1.id } });
			const test = async () => albumService.get(albumQueryParameters);
			const testArtist = () => artistService.get({ id: dummyRepository.artistB.id });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException);
			expect(testArtist()).rejects.toThrow(ArtistNotFoundByIDException); 
		});
	});
});