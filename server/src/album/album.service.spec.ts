import AlbumService from "./album.service";
import { AlbumType } from "@prisma/client";
import ArtistService from "src/artist/artist.service";
import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import AlbumModule from "./album.module";
import PrismaService from "src/prisma/prisma.service";
import { AlbumAlreadyExistsException, AlbumAlreadyExistsWithArtistIDException, AlbumNotEmptyException, AlbumNotFoundFromIDException } from "./album.exceptions";
import Slug from "src/slug/slug";
import { ArtistNotFoundByIDException, ArtistNotFoundException } from "src/artist/artist.exceptions";
import SongModule from "src/song/song.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import { Album } from "src/prisma/models";
import ArtistIllustrationService from "src/artist/artist-illustration.service";

describe('Album Service', () => {
	let albumService: AlbumService;
	let artistService: ArtistService;
	let newAlbum: Album;
	let newCompilationAlbum: Album;
	let dummyRepository: TestPrismaService;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [AlbumModule, ArtistModule, PrismaModule, SongModule, IllustrationModule, GenreModule],
			providers: [ArtistService],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
		module.get(ArtistIllustrationService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
		albumService = module.get<AlbumService>(AlbumService);
	})

	it('should be defined', () => {
		expect(artistService).toBeDefined();
		expect(albumService).toBeDefined();
	});

	describe('Detect Album Type', () => {

		it('should identify title as studio album', () => {
			expect(AlbumService.getAlbumTypeFromName('Into the Skyline')).toBe(AlbumType.StudioRecording);
			expect(AlbumService.getAlbumTypeFromName('Celebration')).toBe(AlbumType.StudioRecording);
			expect(AlbumService.getAlbumTypeFromName('Living Room')).toBe(AlbumType.StudioRecording);
		});

		it('should identify title as live album', () => {
			expect(AlbumService.getAlbumTypeFromName('Intimate & Live')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('Some Album (Live)')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('11,000 Click (Live at Brixton)')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('Unplugged')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('Live À Paris')).toBe(AlbumType.LiveRecording);
		});

		it('should identify title as compilation album', () => {
			expect(AlbumService.getAlbumTypeFromName('Happy BusDay: Best of Superbus')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Very Best of Moby')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Singles Collection')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Immaculate Collection')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('Greatest Hits: My Prerogative')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('A decade of Hits')).toBe(AlbumType.Compilation);
		});

		it("should identify title as video album", () => {
			expect(AlbumService.getAlbumTypeFromName('Britney: The Videos')).toBe(AlbumType.VideoAlbum);
			expect(AlbumService.getAlbumTypeFromName('Greatest Hits: My Prerogative - The Videos')).toBe(AlbumType.VideoAlbum);
			expect(AlbumService.getAlbumTypeFromName('Celebration - The Video Collection')).toBe(AlbumType.VideoAlbum);
			expect(AlbumService.getAlbumTypeFromName('The Video Collection 93:99')).toBe(AlbumType.VideoAlbum);
			expect(AlbumService.getAlbumTypeFromName('Music Videos')).toBe(AlbumType.VideoAlbum);
			expect(AlbumService.getAlbumTypeFromName('Music Videos II')).toBe(AlbumType.VideoAlbum);
			expect(AlbumService.getAlbumTypeFromName('In The Zone DVD')).toBe(AlbumType.VideoAlbum);
		});
		it("should identify title as remix album", () => {
			expect(AlbumService.getAlbumTypeFromName('B In The Mix: The Remixes')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('Rated R: Remixed')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('Move To This - Remix Album')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('Essential Mixes - 12" Masters')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('Everybody Move (To The Mixes)')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('Dance Remixes')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('The Best Mixes From The Album Debut')).toBe(AlbumType.RemixAlbum);
			expect(AlbumService.getAlbumTypeFromName('Mixes')).toBe(AlbumType.RemixAlbum);
		});

		it("should identify title as soundtrack album", () => {
			expect(AlbumService.getAlbumTypeFromName('Evita: The Complete Motion Picture Music Soundtrack')).toBe(AlbumType.Soundtrack);
			expect(AlbumService.getAlbumTypeFromName("Who's That Girl (Original Motion Picture Soundtrack)")).toBe(AlbumType.Soundtrack);
			expect(AlbumService.getAlbumTypeFromName("Berlin Calling (The Soundtrack)")).toBe(AlbumType.Soundtrack);
			expect(AlbumService.getAlbumTypeFromName('Desperate Housewives (Music From and Inspired By The Television Series)')).toBe(AlbumType.Soundtrack);
			expect(AlbumService.getAlbumTypeFromName("The Next Best Thing: Music From the Motion Picture")).toBe(AlbumType.Soundtrack);
			expect(AlbumService.getAlbumTypeFromName("8 femmes (Bande originale du film)")).toBe(AlbumType.Soundtrack);
		});

		it('should identify title as single', () => {
			expect(AlbumService.getAlbumTypeFromName('Twist - Single')).toBe(AlbumType.Single);
			expect(AlbumService.getAlbumTypeFromName('Twist - EP')).toBe(AlbumType.Single);
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
					return albumService.create({ name: dummyRepository.compilationAlbumA.name });
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsException);
			});

			it('should throw, as an album with the same name exists (w/ artist)', () => {
				const test = async () => {
					return albumService.create({
						name: dummyRepository.albumA1.name,
						artist: { id: dummyRepository.artistA.id }
					});
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsWithArtistIDException);
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
					return albumService.create({
						name: dummyRepository.albumA1.name,
						artist: { id: dummyRepository.artistA.id }
					});
				}
				expect(test()).rejects.toThrow(AlbumAlreadyExistsWithArtistIDException);
			});

			it('should throw, as the related artist does not exists', () => {
				const test = async () => {
					return albumService.create({
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
			const albums = await albumService.getMany({});
			expect(albums.length).toBe(5);
			expect(albums).toContainEqual(dummyRepository.albumA1);
			expect(albums).toContainEqual(dummyRepository.albumB1);
			expect(albums).toContainEqual(dummyRepository.compilationAlbumA);
			expect(albums).toContainEqual(newAlbum);
			expect(albums).toContainEqual(newCompilationAlbum);
		});

		it("should find some albums w/ pagination", async () => {
			const albums = await albumService.getMany({}, { take: 2, skip: 2 });
			expect(albums.length).toBe(2);
			expect(albums[0]).toStrictEqual(dummyRepository.compilationAlbumA);
			expect(albums[1]).toStrictEqual(newCompilationAlbum);
		});

		it("should find only live albums", async () => {
			const albums = await albumService.getMany({ type: AlbumType.LiveRecording });
			expect(albums.length).toBe(1);
			expect(albums[0]).toStrictEqual(newAlbum);
		});

		it("should find only compilations albums", async () => {
			const albums = await albumService.getMany({ type: AlbumType.Compilation });
			expect(albums.length).toBe(1);
			expect(albums[0]).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should sort the albums", async () => {
			const albums = await albumService.getMany({}, {}, {}, { sortBy: 'name', order: 'desc' });
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
			const album = await albumService.get(
				{ bySlug: { slug: new Slug(dummyRepository.compilationAlbumA.slug), artist: undefined } }, 
			);
			expect(album).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should find the album (w/ artist)", async () => {
			const album = await albumService.get(
				{ bySlug: { slug: new Slug(dummyRepository.albumA1.slug), artist: { slug: new Slug(dummyRepository.artistA.slug) }} }, 
			);
			expect(album).toStrictEqual(dummyRepository.albumA1);
		});

		it("should find the album (by id)", async () => {
			const album = await albumService.get(
				{ id: dummyRepository.albumB1.id }, 
			);
			expect(album).toStrictEqual(dummyRepository.albumB1);
		});

		it(('should return an existing album, without only its id and slug'), async () => {
			const album = await albumService.select({ id: dummyRepository.albumA1.id }, { slug: true, id: true });
			expect(album).toStrictEqual({ id: dummyRepository.albumA1.id, slug: dummyRepository.albumA1.slug});
		});
		it(('should throw, as the album does not exist '), async () => {
			const test = () => albumService.select({ id: -1 }, { slug: true, id: true });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException);
		});
	});

	describe('Update an album', () => { 
		it('should change the information of the album in the database', async () => {
			const updatedAlbum = await albumService.update(
				{ name: 'My Album Live'},
				{ id: newAlbum.id }
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
			const fetchedAlbum = await albumService.getOrCreate({
				name: dummyRepository.compilationAlbumA.name
			});

			expect(fetchedAlbum).toStrictEqual(dummyRepository.compilationAlbumA);
		});

		it("should find the existing album (w/ artist)", async () => {
			const fetchedAlbum = await albumService.getOrCreate({
				name: dummyRepository.albumB1.name,
				artist: { slug: new Slug(dummyRepository.artistB.slug) }
			});

			expect(fetchedAlbum).toStrictEqual(dummyRepository.albumB1);
		});

		it("should create a new album", async () => {
			const otherAlbum = await albumService.getOrCreate({
				name: 'My Third Compilation Album'
			});
			
			expect(otherAlbum.artistId).toBeNull();
			expect(otherAlbum).not.toStrictEqual(newCompilationAlbum);
			expect(otherAlbum).not.toStrictEqual(dummyRepository.compilationAlbumA);
		});
	});

	describe('Reassign Album', () => {
		it("should assign a compilation album to an artist", async () => {
			const updatedAlbum = await albumService.reassign(
				{ id: dummyRepository.compilationAlbumA.id },
				{ id: dummyRepository.artistA.id }
			);
			expect(updatedAlbum).toStrictEqual({
				...updatedAlbum,
				artistId: dummyRepository.artistA.id
			});
		});
		it("should assign a album as a compilation", async () => {
			const updatedAlbum = await albumService.reassign(
				{ id: dummyRepository.compilationAlbumA.id },
				{ compilationArtist: true }
			);
			expect(updatedAlbum).toStrictEqual({
				...updatedAlbum,
				artistId: null
			});
		});

		it("should throw as the album does not exist", async () => {
			const test = () => albumService.reassign({ id: -1  }, { id: dummyRepository.artistA.id  });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException);
		});

		it("should throw as the new artist does not exist", async () => {
			const test = () => albumService.reassign({ id: dummyRepository.albumA1.id }, { id: -1 });
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException);
		});
	});

	describe('Delete Album', () => {
		it("should throw, as the album does not exist (by id)", () => {
			const test = async () => albumService.delete({  id: -1 } );
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException); 
		});

		it("should not delete the album, as it has releases", async () => {
			const albumQueryParameters = {  id: dummyRepository.compilationAlbumA.id } ;
			
			const test = async () => await albumService.delete(albumQueryParameters);;
			expect(test()).rejects.toThrow(AlbumNotEmptyException); 
		});

		it("should delete the album", async () => {
			const tmpAlbum = await albumService.create({ name: '1234' });
			await albumService.delete({ id: tmpAlbum.id });
			const test = async () => albumService.get({ id: tmpAlbum.id });
			expect(test()).rejects.toThrow(AlbumNotFoundFromIDException);
		});
	});
});