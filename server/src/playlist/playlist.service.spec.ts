import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import { User } from "src/prisma/generated/client";
import type { Playlist } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import Slug from "src/slug/slug";
import { StreamModule } from "src/stream/stream.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import {
	PlaylistAlreadyExistsException,
	PlaylistNotFoundException,
	UnallowedPlaylistUpdate,
} from "./playlist.exceptions";
import PlaylistModule from "./playlist.module";
import PlaylistService from "./playlist.service";

describe("Playlist Service", () => {
	let dummyRepository: TestPrismaService;
	let playlistService: PlaylistService;
	let module: TestingModule;
	let newPlaylist: Playlist;
	let owner: User;
	let otherUser: User;

	beforeAll(async () => {
		module = await createTestingModule({
			imports: [
				PlaylistModule,
				SettingsModule,
				StreamModule,
				ArtistModule,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		playlistService = module.get(PlaylistService);
		await dummyRepository.onModuleInit();
		owner = dummyRepository.user1;
		otherUser = dummyRepository.user2;
	});

	afterAll(async () => {
		await module.close();
	});

	it("should be defined", () => {
		expect(playlistService).toBeDefined();
	});

	describe("Get Playlist", () => {
		it("Should get playlist by ID", async () => {
			const playlist = await playlistService.get(
				{
					id: dummyRepository.playlist3.id,
				},
				owner.id,
			);
			expect(playlist).toStrictEqual(dummyRepository.playlist3);
		});
		it("Should get playlist (not owner)", async () => {
			const playlist = await playlistService.get(
				{
					slug: new Slug(dummyRepository.playlist1.slug),
				},
				otherUser.id,
			);
			expect(playlist).toStrictEqual(dummyRepository.playlist1);
		});

		it("Should get playlist (anonymous)", async () => {
			const playlist = await playlistService.get(
				{
					slug: new Slug(dummyRepository.playlist1.slug),
				},
				null,
			);
			expect(playlist).toStrictEqual(dummyRepository.playlist1);
		});
		it("Should throw, as the playlist does not exist (ID)", async () => {
			const test = () => playlistService.get({ id: -1 }, null);
			return expect(test()).rejects.toThrow(PlaylistNotFoundException);
		});
		it("Should throw, as the playlist does not exist (Slug)", async () => {
			const test = () =>
				playlistService.get({ slug: new Slug("12345") }, null);
			return expect(test()).rejects.toThrow(PlaylistNotFoundException);
		});

		it("Should throw, as the user is not allowed to access playlist", async () => {
			const test = () =>
				playlistService.get(
					{ id: dummyRepository.playlist3.id },
					otherUser.id,
				);
			return expect(test()).rejects.toThrow(PlaylistNotFoundException);
		});
	});

	describe("Get Many Playlists", () => {
		it("Should sort playlists by name", async () => {
			const playlists = await playlistService.getMany(
				{},
				owner.id,
				{ order: "asc", sortBy: "name" },
				{},
			);

			expect(playlists.length).toBe(3);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
			expect(playlists.at(1)?.id).toBe(dummyRepository.playlist3.id);
			expect(playlists.at(2)?.id).toBe(dummyRepository.playlist2.id);
		});
		it("Should sort playlists by create date", async () => {
			const playlists = await playlistService.getMany(
				{},
				owner.id,
				{ order: "asc", sortBy: "creationDate" },
				{},
			);

			expect(playlists.length).toBe(3);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
			expect(playlists.at(1)?.id).toBe(dummyRepository.playlist2.id);
			expect(playlists.at(2)?.id).toBe(dummyRepository.playlist3.id);
		});
		it("Should sort playlists by entry count", async () => {
			const playlists = await playlistService.getMany(
				{},
				owner.id,
				{ order: "desc", sortBy: "entryCount" },
				{},
			);

			expect(playlists.length).toBe(3);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
		});

		it("Should return only public playlists", async () => {
			const playlists = await playlistService.getMany({}, null, {}, {});

			expect(playlists.length).toBe(2);
			expect(playlists.at(0)?.id).toBe(dummyRepository.playlist1.id);
			expect(playlists.at(1)?.id).toBe(dummyRepository.playlist2.id);
		});
	});

	describe("Update Playlist", () => {
		it("Should update playlist Name", async () => {
			const updatedPlaylist = await playlistService.update(
				{ name: "Playlist 2" },
				{ id: dummyRepository.playlist2.id },
				owner.id,
			);

			expect(updatedPlaylist).toStrictEqual({
				...dummyRepository.playlist2,
				name: "Playlist 2",
				slug: `playlist-2-${owner.id}`,
			});
			await playlistService.update(
				{ name: dummyRepository.playlist2.name },
				{ id: dummyRepository.playlist2.id },
				owner.id,
			);
		});
		it("Should throw, as the playlist already exists", async () => {
			const test = () =>
				playlistService.update(
					{ name: dummyRepository.playlist1.name },
					{ id: dummyRepository.playlist2.id },
					owner.id,
				);

			return expect(test()).rejects.toThrow(
				PlaylistAlreadyExistsException,
			);
		});

		it("Should throw, as changes are not allowed", async () => {
			const test = () =>
				playlistService.update(
					{ name: "a" },
					{ id: dummyRepository.playlist2.id },
					otherUser.id,
				);

			return expect(test()).rejects.toThrow(UnallowedPlaylistUpdate);
		});
	});

	describe("Flatten", () => {
		it("Should Flatten playlist", async () => {
			await dummyRepository.playlistEntry.update({
				where: { id: dummyRepository.playlistEntry1.id },
				data: { index: 10 },
			});
			await dummyRepository.playlistEntry.update({
				where: { id: dummyRepository.playlistEntry2.id },
				data: { index: 20 },
			});
			await dummyRepository.playlistEntry.update({
				where: { id: dummyRepository.playlistEntry3.id },
				data: { index: 100 },
			});

			await playlistService.flatten({ id: dummyRepository.playlist1.id });
			const movedEntry1 =
				await dummyRepository.playlistEntry.findFirstOrThrow({
					where: { id: dummyRepository.playlistEntry1.id },
				});
			const movedEntry2 =
				await dummyRepository.playlistEntry.findFirstOrThrow({
					where: { id: dummyRepository.playlistEntry2.id },
				});
			const movedEntry3 =
				await dummyRepository.playlistEntry.findFirstOrThrow({
					where: { id: dummyRepository.playlistEntry3.id },
				});

			expect(movedEntry1.index).toBe(0);
			expect(movedEntry2.index).toBe(1);
			expect(movedEntry3.index).toBe(2);
		});
	});

	describe("Create Playlist", () => {
		it("should create playlist", async () => {
			const now = new Date();
			newPlaylist = await playlistService.create({
				name: "New Playlist",
				ownerId: owner.id,
				isPublic: true,
				allowChanges: true,
			});
			expect(newPlaylist.id).toBeDefined();
			expect(newPlaylist.name).toBe("New Playlist");
			expect(newPlaylist.slug).toBe(`new-playlist-${owner.id}`);
			expect(newPlaylist.createdAt.getUTCDate()).toBe(now.getUTCDate());
		});
		it("Should throw, as the playlist already exists", async () => {
			const test = () =>
				playlistService.create({
					name: dummyRepository.playlist1.name,
					ownerId: owner.id,
					isPublic: true,
					allowChanges: true,
				});
			return expect(test()).rejects.toThrow(
				PlaylistAlreadyExistsException,
			);
		});
	});

	describe("Get Playlists by Album", () => {
		it("Should Get One Playlist (Song appearing once)", async () => {
			const playlists = await playlistService.getMany(
				{ album: { id: dummyRepository.compilationAlbumA.id } },
				owner.id,
				{ order: "asc", sortBy: "name" },
				{},
			);

			expect(playlists.length).toBe(1);
		});
		it("Should Get One Playlist (Song appearing twice)", async () => {
			const playlists = await playlistService.getMany(
				{ album: { id: dummyRepository.albumA1.id } },
				owner.id,
				{ order: "asc", sortBy: "name" },
				{},
			);

			expect(playlists.length).toBe(1);
		});

		it("Should Get 0 Playlist", async () => {
			const playlists = await playlistService.getMany(
				{ album: { id: dummyRepository.albumB1.id } },
				owner.id,
				{ order: "asc", sortBy: "name" },
				{},
			);

			expect(playlists.length).toBe(0);
		});
	});
});
