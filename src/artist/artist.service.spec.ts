import { createTestingModule } from "test/TestModule";
import type { TestingModule } from "@nestjs/testing";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { ArtistAlreadyExistsException, ArtistNotFoundByIDException, ArtistNotFoundException } from "./artist.exceptions";
import ArtistModule from "./artist.module";
import ArtistService from "./artist.service"
import SongModule from "src/song/song.module";
import AlbumModule from "src/album/album.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TrackModule from "src/track/track.module";

describe('Artist Service', () => {
	let artistService: ArtistService;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [ArtistModule, PrismaModule, SongModule, AlbumModule, IllustrationModule, GenreModule, TrackModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
	});

	it('should be defined', () => {
		expect(artistService).toBeDefined();
	});
	const artistName = 'My name';

	describe('Create Artist', () => {
		it(('should create a new artist'), async () => {
			let artist = await artistService.createArtist({ name: artistName });
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe(artistName);
			expect(artist.slug).toBe('my-name');
			expect(artist.id).toBeDefined();
		});

		it(('should create a second artist'), async () => {
			let artist = await artistService.createArtist({ name: 'My Artist 2' });
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.slug).toBe('my-artist-2');
			expect(artist.id).toBeDefined();
		})
	
		it(('should throw as artist already exists'), () => {
			const test = async () => {
				await artistService.createArtist({ name: artistName });
			};
			expect(test()).rejects.toThrow(ArtistAlreadyExistsException);
		})
	})

	describe('Get Artist', () => {
		it(('should return an existing artist, without relations'), async () => {
			let artist = await artistService.getArtist({ slug: new Slug(artistName) });
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe(artistName);
			expect(artist.slug).toBe('my-name');
			expect(artist.id).toBeDefined();
		})
	
		it(('should return an existing artist, with relations'), async () => {
			let artist = await artistService.getArtist({ slug: new Slug(artistName) }, {
				albums: true,
				songs: true
			});
			expect(artist.songs).toStrictEqual([]);
			expect(artist.albums).toStrictEqual([]);
			expect(artist.name).toBe(artistName);
			expect(artist.slug).toBe('my-name');
			expect(artist.id).toBeDefined();
		})
	});

	describe('Get Artists', () => {
		it(('should return all artists'), async () => {
			let artists = await artistService.getArtists({ });
			expect(artists.length).toBe(2);
			expect(artists[0].slug).toBe('my-name');
			expect(artists[1].slug).toBe('my-artist-2');
		});

		it(('should return all artists, sorted by name'), async () => {
			let artists = await artistService.getArtists({}, {}, {}, { sortBy: 'name', order: 'asc' });
			expect(artists.length).toBe(2);
			expect(artists[0].slug).toBe('my-artist-2');
			expect(artists[1].slug).toBe('my-name');
		})
	});

	describe('Get or Create Artist', () => {
		it(('should get the existing artist'), async () => {
			let artist = await artistService.getArtist({ slug: new Slug(artistName) });
			let artistGet = await artistService.getOrCreateArtist({ name: artistName });
			expect(artistGet.songs).toBeUndefined();
			expect(artistGet.albums).toBeUndefined();
			expect(artistGet.name).toBe(artist.name);
			expect(artistGet.slug).toBe(artist.slug);
			expect(artistGet.id).toBe(artist.id);
		})
	
		it(('should create a new artist, as it does not exists'), async () => {
			let artist = await artistService.getOrCreateArtist({ name: 'My Artist2'});
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe('My Artist2');
			expect(artist.slug).toBe('my-artist2');
			expect(artist.id).toBe(artist.id);
		})
	});

	describe("Count Artist", () => {
		it("should count the artist count", async () => {
			let artistCount = await artistService.countArtists({});
			expect(artistCount).toBe(3);
		})

		it("should count the artists by name (starts with)", async () => {
			let artistCount = await artistService.countArtists({ byName: { startsWith: artistName } });
			expect(artistCount).toBe(1);
		});

		it("should count the artists by name (is)", async () => {
			let artistCount = await artistService.countArtists({ byName: { is: artistName } });
			expect(artistCount).toBe(1);
		});
	})

	describe('Delete Artist', () => {
		it("should throw, as the artist does not exist (by id)", () => {
			const test = async () => artistService.deleteArtist({ id: -1 });
			expect(test()).rejects.toThrow(ArtistNotFoundByIDException); 
		});

		it("should throw, as the artist does not exist (by slug)", () => {
			const test = async () => artistService.deleteArtist({ slug: new Slug("Trololol") });
			expect(test()).rejects.toThrow(ArtistNotFoundException); 
		});

		it("should delete the artist", async () => {
			const artistQueryParameters = {
				slug: new Slug("My Name")
			}
			await artistService.deleteArtist(artistQueryParameters);
			const test = async () => artistService.getArtist(artistQueryParameters);
			expect(test()).rejects.toThrow(ArtistNotFoundException); 
		});
	});
})