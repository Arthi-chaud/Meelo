import { TestingModule } from "@nestjs/testing";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import PlaylistModule from "./playlist.module";
import PlaylistService from "./playlist.service";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { PlaylistAlreadyExistsException, PlaylistNotFoundException, PlaylistNotFoundFromIDException } from "./playlist.exceptions";
import { Playlist } from "src/prisma/models";

describe('Playlist Service', () => {
	let dummyRepository: TestPrismaService;
	let playlistService: PlaylistService;
	let module: TestingModule;
	let newPlaylist: Playlist;

	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PlaylistModule, SettingsModule],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		dummyRepository = module.get(PrismaService);
		playlistService = module.get(PlaylistService);
		module.get(SettingsService).loadFromFile();
		await dummyRepository.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	it('should be defined', () => {
		expect(playlistService).toBeDefined();
	});

	describe('Get Playlist', () => {
		it("Should get playlist by ID", async () => {
			const playlist = await playlistService.get({
				id: dummyRepository.playlist3.id
			});
			expect(playlist).toStrictEqual(dummyRepository.playlist3);
		});
		it("Should get playlist by Slug", async () => {
			const playlist = await playlistService.get({
				slug: new Slug(dummyRepository.playlist1.slug)
			});
			expect(playlist).toStrictEqual(dummyRepository.playlist1);
		});
		it("Should throw, as the playlist does not exist (ID)", async () => {
			const test = ()  => playlistService.get({ id: -1 });
			expect(test()).rejects.toThrow(PlaylistNotFoundFromIDException)
		});
		it("Should throw, as the playlist does not exist (Slug)", async () => {
			const test = ()  => playlistService.get({ slug: new Slug('12345') });
			expect(test()).rejects.toThrow(PlaylistNotFoundException)
		})
	});

	describe('Get Many Playlists', () => {
		it('Should sort playlists by name', async () => {
			const playlists = await playlistService.getMany({ }, {}, {}, { order: 'asc', sortBy: 'name' });

			expect(playlists.length).toBe(3);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
			expect(playlists.at(1)?.id).toBe(dummyRepository.playlist3.id);
			expect(playlists.at(2)?.id).toBe(dummyRepository.playlist2.id);
		});
		it('Should sort playlists by create date', async () => {
			const playlists = await playlistService.getMany({ }, {}, {}, { order: 'asc', sortBy: "creationDate" });

			expect(playlists.length).toBe(3);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
			expect(playlists.at(1)?.id).toBe(dummyRepository.playlist2.id);
			expect(playlists.at(2)?.id).toBe(dummyRepository.playlist3.id);
		});
		it('Should sort playlists by entry count', async () => {
			const playlists = await playlistService.getMany({ }, {}, {}, { order: 'desc', sortBy: "entryCount" });

			expect(playlists.length).toBe(3);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
		})
	});

	describe('Update Playlist', () => {
		it("Should update playlist Name", async () => {
			const updatedPlaylist = await playlistService.update(
				{ name: 'Playlist 2' }, { id: dummyRepository.playlist2.id }
			);

			expect(updatedPlaylist).toStrictEqual({
				...dummyRepository.playlist2,
				name: 'Playlist 2',
				slug: 'playlist-2'
			});
			await playlistService.update(
				{ name: dummyRepository.playlist2.name },
				{ id: dummyRepository.playlist2.id }
			);
		});
		it("Should update throw, as the playlist already exists", async () => {
			const test = () => playlistService.update(
				{ name: dummyRepository.playlist1.name },
				{ id: dummyRepository.playlist2.id }
			);

			expect(test()).rejects.toThrow(PlaylistAlreadyExistsException);
		});
	})

	describe('Flatten', () => {
		it("Should Flatten playlist", async () =>  {
			await dummyRepository.playlistEntry.update({ where: { id: dummyRepository.playlistEntry1.id }, data: { index: 10 }});
			await dummyRepository.playlistEntry.update({ where: { id: dummyRepository.playlistEntry2.id }, data: { index: 20 }});
			await dummyRepository.playlistEntry.update({ where: { id: dummyRepository.playlistEntry3.id }, data: { index: 100 }});

			await playlistService.flatten({ id: dummyRepository.playlist1.id });
			const movedEntry1 = await dummyRepository.playlistEntry.findFirstOrThrow({ where: { id: dummyRepository.playlistEntry1.id }});
			const movedEntry2 = await dummyRepository.playlistEntry.findFirstOrThrow({ where: { id: dummyRepository.playlistEntry2.id }});
			const movedEntry3 = await dummyRepository.playlistEntry.findFirstOrThrow({ where: { id: dummyRepository.playlistEntry3.id }});

			expect(movedEntry1.index).toBe(0);
			expect(movedEntry2.index).toBe(1);
			expect(movedEntry3.index).toBe(2);
		})
	})

	describe('Create Playlist', () => {
		it('should create playlist', async () => {
			const now = new Date();
			newPlaylist = await playlistService.create({
				name: 'New Playlist'
			});
			expect(newPlaylist.id).toBeDefined();
			expect(newPlaylist.name).toBe('New Playlist');
			expect(newPlaylist.slug).toBe('new-playlist');
			expect(newPlaylist.createdAt.getUTCDate()).toBe(now.getUTCDate())
		});
		it("Should throw, as the playlist already exists", async () => {
			const test = ()  => playlistService.create({ name: dummyRepository.playlist1.name });
			expect(test()).rejects.toThrow(PlaylistAlreadyExistsException)
		})
	})
})