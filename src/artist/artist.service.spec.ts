import { Test, TestingModule } from "@nestjs/testing";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { PrismaService } from "src/prisma/prisma.service";
import { Slug } from "src/slug/slug";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { ArtistalreadyExistsException } from "./artist.exceptions";
import { ArtistModule } from "./artist.module";
import { ArtistService } from "./artist.service"

describe('Artist Service', () => {
	let artistService: ArtistService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ArtistModule, PrismaModule],
			providers: [ArtistService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		await module.get<PrismaService>(PrismaService).onModuleInit();
		artistService = module.get<ArtistService>(ArtistService);
	});

	it('should be defined', () => {
		expect(artistService).toBeDefined();
	});
	let artistName = 'My name';

	describe('Create Artist', () => {
		it(('should create a new artist'), async () => {
			let artist = await artistService.createArtist(artistName);
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe(artistName);
			expect(artist.slug).toBe('my-name');
			expect(artist.id).toBeDefined();
		})
	
		it(('should throw as artist already exists'), () => {
			const test = async () => {
				await artistService.createArtist(artistName);
			};
			expect(test()).rejects.toThrow(ArtistalreadyExistsException);
		})
	})

	describe('Get Artist', () => {
		it(('should return an existing artist, without relations'), async () => {
			let artist = await artistService.getArtist(new Slug(artistName));
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe(artistName);
			expect(artist.slug).toBe('my-name');
			expect(artist.id).toBeDefined();
		})
	
		it(('should return an existing artist, with relations'), async () => {
			let artist = await artistService.getArtist(new Slug(artistName), {
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

	describe('Get or Create Artist', () => {
		it(('should get the existing artist'), async () => {
			let artist = await artistService.getArtist(new Slug(artistName));
			let artistGet = await artistService.getOrCreateArtist(artistName);
			expect(artistGet.songs).toBeUndefined();
			expect(artistGet.albums).toBeUndefined();
			expect(artistGet.name).toBe(artist.name);
			expect(artistGet.slug).toBe(artist.slug);
			expect(artistGet.id).toBe(artist.id);
		})
	
		it(('should create a new artist, as it does not exists'), async () => {
			let artist = await artistService.getOrCreateArtist('My Artist2');
			expect(artist.songs).toBeUndefined();
			expect(artist.albums).toBeUndefined();
			expect(artist.name).toBe('My Artist2');
			expect(artist.slug).toBe('my-artist2');
			expect(artist.id).toBe(artist.id);
		})
	})
})