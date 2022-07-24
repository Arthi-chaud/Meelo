import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import { ArtistAlreadyExistsException, ArtistNotFoundByIDException, ArtistNotFoundException } from "./artist.exceptions";
import ArtistModule from "./artist.module";
import ArtistService from "./artist.service"
import SongModule from "src/song/song.module";
import AlbumModule from "src/album/album.module";
import IllustrationModule from "src/illustration/illustration.module";
import GenreModule from "src/genre/genre.module";
import TrackModule from "src/track/track.module";
import TestPrismaService from "test/test-prisma.service";
import type { Artist } from "@prisma/client";

describe('Artist Service', () => {
	let artistService: ArtistService;
	let dummyRepository : TestPrismaService;
	let newArtist: Artist;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [ArtistModule, PrismaModule, SongModule, AlbumModule, IllustrationModule, GenreModule, TrackModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository =  module.get(PrismaService);
		await dummyRepository.onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
	});

	it('should be defined', () => {
		expect(artistService).toBeDefined();
	});

	describe('Create Artist', () => {
		it(('should create a new artist'), async () => {
			newArtist = await artistService.createArtist({ name: 'My New Artist' });
			expect(newArtist.name).toBe('My New Artist');
			expect(newArtist.slug).toBe('my-new-artist');
			expect(newArtist.id).toBeDefined();
		});
	
		it(('should throw as artist already exists'), () => {
			const test = async () => {
				await artistService.createArtist({ name: dummyRepository.artistA.name });
			};
			expect(test()).rejects.toThrow(ArtistAlreadyExistsException);
		})
	})

	describe('Get Artist', () => {
		it(('should return an existing artist, without relations'), async () => {
			let artist = await artistService.getArtist({ slug: new Slug(dummyRepository.artistC.slug) });
			expect(artist).toStrictEqual(dummyRepository.artistC);
		})
	
		it(('should return an existing artist, with relations'), async () => {
			let artist = await artistService.getArtist({ slug: new Slug(dummyRepository.artistB.slug) }, {
				albums: true,
				songs: true
			});
			expect(artist).toStrictEqual({
				...dummyRepository.artistB,
				songs: [ dummyRepository.songB1 ],
				albums: [ dummyRepository.albumB1 ]
			})
		})
	});

	describe('Get Artists', () => {
		it(('should return all artists'), async () => {
			let artists = await artistService.getArtists({ });
			expect(artists.length).toBe(4);
			expect(artists).toContain(dummyRepository.artistA);
			expect(artists).toContain(dummyRepository.artistB);
			expect(artists).toContain(dummyRepository.artistC);
			expect(artists).toContain(newArtist);
		});

		it(('should return all artists, sorted by name'), async () => {
			let artists = await artistService.getArtists({}, {}, {}, { sortBy: 'name', order: 'asc' });
			expect(artists.length).toBe(2);
			expect(artists[0]).toStrictEqual(dummyRepository.artistA);
			expect(artists[1]).toStrictEqual(newArtist);
			expect(artists[2]).toStrictEqual(dummyRepository.artistB);
			expect(artists[3]).toStrictEqual(dummyRepository.artistC);
		})
	});

	describe('Get or Create Artist', () => {
		it(('should get the existing artist'), async () => {
			let artistGet = await artistService.getOrCreateArtist({ name: dummyRepository.artistA.name });
			expect(artistGet).toStrictEqual(dummyRepository.artistA);
		})
	
		it(('should create a new artist, as it does not exists'), async () => {
			let artist = await artistService.getOrCreateArtist({ name: 'My Artist 2'});
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe('My Artist2');
			expect(artist.slug).toBe('my-artist2');
			expect(artist.id).not.toBe(dummyRepository.artistA.id);
			expect(artist.id).not.toBe(newArtist.id);
			expect(artist.id).not.toBe(dummyRepository.artistB.id);
			expect(artist.id).not.toBe(dummyRepository.artistC.id);
		})
	});

	describe("Count Artist", () => {
		it("should count the artist count", async () => {
			let artistCount = await artistService.countArtists({});
			expect(artistCount).toBe(5);
		})

		it("should count the artists by name (starts with)", async () => {
			let artistCount = await artistService.countArtists({ byName: { startsWith: 'My A' } });
			expect(artistCount).toBe(2);
		});

		it("should count the artists by name (is)", async () => {
			let artistCount = await artistService.countArtists({ byName: { is: dummyRepository.artistC.name } });
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
				slug: new Slug(dummyRepository.artistB.name)
			}
			await artistService.deleteArtist(artistQueryParameters);
			const test = async () => artistService.getArtist(artistQueryParameters);
			expect(test()).rejects.toThrow(ArtistNotFoundException); 
		});
	});
})