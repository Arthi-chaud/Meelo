import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { createTestingModule } from "test/test-module";
import PlaylistModule from "./playlist.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import TestPrismaService from "test/test-prisma.service";
import SetupApp from "test/setup-app";
import { Playlist } from "@prisma/client";
import {
	expectedPlaylistEntryResponse,
	expectedPlaylistResponse,
} from "test/expected-responses";
import request from "supertest";
import PlaylistService from "./playlist.service";
import IllustrationModule from "src/illustration/illustration.module";

describe("Playlist Controller", () => {
	let app: INestApplication;
	let module: TestingModule;
	let dummyRepository: TestPrismaService;
	let newPlaylist: Playlist;
	let playlistService: PlaylistService;

	beforeAll(async () => {
		module = await createTestingModule({
			imports: [IllustrationModule, PlaylistModule, PrismaModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		playlistService = module.get(PlaylistService);
		app = await SetupApp(module);
		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Get Playlist", () => {
		it("Should get playlist (by ID)", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist2.id}`)
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual(
						expectedPlaylistResponse(dummyRepository.playlist2),
					);
				});
		});
		it("Should get playlist (by Slug)", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist3.slug}`)
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual(
						expectedPlaylistResponse(dummyRepository.playlist3),
					);
				});
		});
		it("Should Error: Playlist Does not exist", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/-1`)
				.expect(404);
		});
		it("Should get playlist with entries", async () => {
			return request(app.getHttpServer())
				.get(
					`/playlists/${dummyRepository.playlist1.slug}?with=entries`,
				)
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual({
						...expectedPlaylistResponse(dummyRepository.playlist1),
						entries: [
							expectedPlaylistEntryResponse(
								dummyRepository.songC1,
								dummyRepository.playlistEntry3.id,
							),
							expectedPlaylistEntryResponse(
								dummyRepository.songA2,
								dummyRepository.playlistEntry1.id,
							),
							expectedPlaylistEntryResponse(
								dummyRepository.songA1,
								dummyRepository.playlistEntry2.id,
							),
						],
					});
				});
		});
	});

	describe("Get Playlists", () => {
		it("Should get All Playlist, by name", async () => {
			return request(app.getHttpServer())
				.get(`/playlists?sortBy=name`)
				.expect(200)
				.expect((res) => {
					const playlists: Playlist[] = res.body.items;
					expect(playlists).toStrictEqual([
						expectedPlaylistResponse(dummyRepository.playlist1),
						expectedPlaylistResponse(dummyRepository.playlist3),
						expectedPlaylistResponse(dummyRepository.playlist2),
					]);
				});
		});
		it("Should get Some Playlists", () => {
			return request(app.getHttpServer())
				.get(`/playlists?sortBy=id&order=desc&take=2`)
				.expect(200)
				.expect((res) => {
					const playlists: Playlist[] = res.body.items;
					expect(playlists).toStrictEqual([
						expectedPlaylistResponse(dummyRepository.playlist3),
						expectedPlaylistResponse(dummyRepository.playlist2),
					]);
				});
		});
		it("Should sort playlists", () => {
			return request(app.getHttpServer())
				.get(`/playlists?sortBy=creationDate&order=desc`)
				.expect(200)
				.expect((res) => {
					const playlists: Playlist[] = res.body.items;
					expect(playlists).toStrictEqual([
						expectedPlaylistResponse(dummyRepository.playlist3),
						expectedPlaylistResponse(dummyRepository.playlist2),
						expectedPlaylistResponse(dummyRepository.playlist1),
					]);
				});
		});
	});

	describe("Create Playlist", () => {
		it("Should Create Playlist", async () => {
			return request(app.getHttpServer())
				.post(`/playlists/new`)
				.send({
					name: "New Playlist",
				})
				.expect(201)
				.expect((res) => {
					const newPlaylistResponse = res.body;
					newPlaylist = {
						...newPlaylistResponse,
						createdAt: new Date(newPlaylistResponse.createdAt),
					};
					expect(newPlaylistResponse).toStrictEqual(
						expectedPlaylistResponse(newPlaylist),
					);
				});
		});
		it("Should Error: Playlist Already Exists", async () => {
			return request(app.getHttpServer())
				.post(`/playlists/new`)
				.send({
					name: dummyRepository.playlist1.name,
				})
				.expect(HttpStatus.CONFLICT);
		});
	});

	describe("Update Playlist", () => {
		it("Should Rename Playlist", async () => {
			return request(app.getHttpServer())
				.put(`/playlists/${newPlaylist.slug}`)
				.send({
					name: "AAAAAAAAAAAAAAAAa",
				})
				.expect(200)
				.expect((res) => {
					newPlaylist.name = res.body.name;
					newPlaylist.slug = res.body.slug;
					expect(res.body).toStrictEqual({
						...expectedPlaylistResponse(newPlaylist),
					});
				});
		});
		it("Should Error: Playlist Already Exists", async () => {
			return request(app.getHttpServer())
				.put(`/playlists/${newPlaylist.id}`)
				.send({
					name: dummyRepository.playlist3.name,
				})
				.expect(HttpStatus.CONFLICT);
		});
	});

	describe("Delete Playlist", () => {
		it("Should Delete Playlist", async () => {
			await request(app.getHttpServer())
				.delete(`/playlists/${newPlaylist.id}`)
				.expect(200);
		});
		it("Should Error: Playlist Does not exist", async () => {
			await request(app.getHttpServer())
				.get(`/playlists/${newPlaylist.id}`)
				.expect(404);
		});
	});

	describe("Add Song To Playlist", () => {
		it("Should Add Song to Playlist Entry", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/entries/new`)
				.send({
					playlistId: dummyRepository.playlist1.id,
					songId: dummyRepository.songB1.id,
				})
				.expect(201);
			const { entries } = await playlistService.get(
				{ id: dummyRepository.playlist1.id },
				{ entries: true },
			);
			expect(entries.length).toBe(4);
			expect(entries.at(3)!.index).toBe(
				dummyRepository.playlistEntry2.index + 1,
			);
			expect(entries.at(3)!.songId).toBe(dummyRepository.songB1.id);
			await dummyRepository.playlistEntry.delete({
				where: { id: entries.at(3)!.id },
			});
		});

		it("Should Error: Song not found", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/entries/new`)
				.send({
					playlistId: dummyRepository.playlist1.id,
					songId: -1,
				})
				.expect(404);
		});

		it("Should Error: Playlist not Found", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/entries/new`)
				.send({
					playlistId: -1,
					songId: dummyRepository.songB1.id,
				})
				.expect(404);
		});
	});

	describe("Reorder Entry", () => {
		it("Should Error: Negative Number", async () => {
			await request(app.getHttpServer())
				.put(`/playlists/${dummyRepository.playlist1.id}/reorder`)
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						-1,
					],
				})
				.expect(400);
		});

		it("Should Error: Incomplete List", async () => {
			await request(app.getHttpServer())
				.put(`/playlists/${dummyRepository.playlist1.id}/reorder`)
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry3.id,
					],
				})
				.expect(400);
		});

		it("Should Error: Unknown Index", async () => {
			await request(app.getHttpServer())
				.put(`/playlists/${dummyRepository.playlist1.id}/reorder`)
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						0,
					],
				})
				.expect(400);
		});

		it("Should Error: Duplicate Index", async () => {
			await request(app.getHttpServer())
				.put(`/playlists/${dummyRepository.playlist1.id}/reorder`)
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						dummyRepository.playlistEntry2.id,
					],
				})
				.expect(400);
		});
		it("Should Move Entries", async () => {
			await request(app.getHttpServer())
				.put(`/playlists/${dummyRepository.playlist1.id}/reorder`)
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						dummyRepository.playlistEntry3.id,
					],
				})
				.expect(200);
			await request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist1.id}?with=entries`)
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual({
						...expectedPlaylistResponse(dummyRepository.playlist1),
						entries: [
							expectedPlaylistEntryResponse(
								dummyRepository.songA2,
								dummyRepository.playlistEntry1.id,
							),
							expectedPlaylistEntryResponse(
								dummyRepository.songA1,
								dummyRepository.playlistEntry2.id,
							),
							expectedPlaylistEntryResponse(
								dummyRepository.songC1,
								dummyRepository.playlistEntry3.id,
							),
						],
					});
				});
		});
	});

	describe("Delete Playlist Entry", () => {
		it("Should Move Entry", async () => {
			await request(app.getHttpServer())
				.delete(
					`/playlists/entries/${dummyRepository.playlistEntry2.id}`,
				)
				.expect(200);
		});

		it("Should Have Flattened Playlist", async () => {
			const { entries } = await playlistService.get(
				{ id: dummyRepository.playlist1.id },
				{ entries: true },
			);
			expect(entries.length).toBe(2);
			expect(entries).toContainEqual({
				...dummyRepository.playlistEntry3,
				index: 1,
			});
			expect(entries).toContainEqual({
				...dummyRepository.playlistEntry1,
				index: 0,
			});
		});

		it("Should Error: Entry not found", async () => {
			await request(app.getHttpServer())
				.delete(
					`/playlists/entries/${dummyRepository.playlistEntry2.id}`,
				)
				.expect(404);
		});
	});

	describe("Playlist Illustration", () => {
		it("Should return the illustration", async () => {
			const illustration =
				await dummyRepository.playlistIllustration.create({
					data: {
						playlistId: dummyRepository.playlist3.id,
						blurhash: "A",
						colors: ["B"],
					},
				});
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist3.id}`)
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual({
						...playlist,
						illustration: {
							...illustration,
							url:
								"/illustrations/playlists/" +
								dummyRepository.playlist3.slug,
						},
					});
				});
		});
	});
});
