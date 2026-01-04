import {
	HttpStatus,
	type INestApplication,
	MiddlewareConsumer,
	Module,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { TestingModule } from "@nestjs/testing";
import { AppProviders, applyMiddlewares } from "src/app.plugins";
import AuthenticationModule from "src/authentication/authentication.module";
import IllustrationModule from "src/illustration/illustration.module";
import { IllustrationType, type Playlist } from "src/prisma/generated/client";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import SettingsService from "src/settings/settings.service";
import UserService from "src/user/user.service";
import request from "supertest";
import {
	expectedPlaylistEntryResponse,
	expectedPlaylistResponse,
} from "test/expected-responses";
import SetupApp from "test/setup-app";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import type { PlaylistEntryResponse } from "./models/playlist.response";
import PlaylistModule from "./playlist.module";
import PlaylistService from "./playlist.service";

@Module({
	imports: [
		AuthenticationModule,
		SettingsModule,
		IllustrationModule,
		PlaylistModule,
		PrismaModule,
	],
	providers: [UserService, PrismaService, ...AppProviders],
})
class TestModule {
	configure(consumer: MiddlewareConsumer) {
		applyMiddlewares(consumer);
	}
}
describe("Playlist Controller", () => {
	let app: INestApplication;
	let module: TestingModule;
	let dummyRepository: TestPrismaService;
	let newPlaylist: Playlist;
	let playlistService: PlaylistService;
	let accessToken: string;
	let accessToken2: string;

	beforeAll(async () => {
		module = await createTestingModule({
			imports: [TestModule],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		dummyRepository = module.get(PrismaService);
		playlistService = module.get(PlaylistService);
		const settingsService = module.get(SettingsService);
		app = await SetupApp(module);
		await dummyRepository.onModuleInit();
		accessToken = module.get(JwtService).sign({
			name: dummyRepository.user1.name,
			id: dummyRepository.user1.id,
		});

		jest.spyOn(
			SettingsService.prototype,
			"settingsValues",
			"get",
		).mockReturnValue({
			...settingsService.settingsValues,
			allowAnonymous: true,
		});

		accessToken2 = module.get(JwtService).sign({
			name: dummyRepository.user2.name,
			id: dummyRepository.user2.id,
		});
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe("Get Playlist", () => {
		it("Should get playlist (annonymous)", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist1.id}`)
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual(
						expectedPlaylistResponse(dummyRepository.playlist1),
					);
				});
		});
		it("Should get playlist (owner)", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist1.slug}`)
				.auth(accessToken, { type: "bearer" })
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual(
						expectedPlaylistResponse(dummyRepository.playlist1),
					);
				});
		});

		it("Should Error: Playlist is not public", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist3.id}`)
				.expect(404);
		});
		it("Should Error: Playlist is not visible", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist3.id}`)
				.auth(accessToken2, { type: "bearer" })
				.expect(404);
		});
		it("Should Error: Playlist Does not exist", async () => {
			return request(app.getHttpServer())
				.get("/playlists/-1")
				.expect(404);
		});
	});

	describe("Get Entries", () => {
		it("Should return entries", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist1.slug}/entries`)
				.auth(accessToken, { type: "bearer" })
				.expect(200)
				.expect((res) => {
					const entries: PlaylistEntryResponse[] = res.body.items;
					expect(entries).toStrictEqual([
						expectedPlaylistEntryResponse(
							dummyRepository.songC1,
							0,
							dummyRepository.playlistEntry3.id,
						),
						expectedPlaylistEntryResponse(
							dummyRepository.songA2,
							1,
							dummyRepository.playlistEntry1.id,
						),
						expectedPlaylistEntryResponse(
							dummyRepository.songA1,
							2,
							dummyRepository.playlistEntry2.id,
						),
					]);
				});
		});

		it("Should error: non-public playlist", async () => {
			return request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist3.slug}/entries`)
				.expect(404);
		});
	});

	describe("Get Playlists", () => {
		it("Should get All Playlist, by name", async () => {
			return request(app.getHttpServer())
				.get("/playlists?sortBy=name")
				.auth(accessToken, { type: "bearer" })
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

		it("Should get only public playlists", async () => {
			return request(app.getHttpServer())
				.get("/playlists?sortBy=name")
				.expect(200)
				.expect((res) => {
					const playlists: Playlist[] = res.body.items;
					expect(playlists).toStrictEqual([
						expectedPlaylistResponse(dummyRepository.playlist1),
						expectedPlaylistResponse(dummyRepository.playlist2),
					]);
				});
		});

		it("Should get only editable playlists", async () => {
			return request(app.getHttpServer())
				.get("/playlists?changeable=true")
				.auth(accessToken2, { type: "bearer" })
				.expect(200)
				.expect((res) => {
					const playlists: Playlist[] = res.body.items;
					expect(playlists).toStrictEqual([
						expectedPlaylistResponse(dummyRepository.playlist1),
					]);
				});
		});
		it("Should get Some Playlists", () => {
			return request(app.getHttpServer())
				.get("/playlists?sortBy=id&order=desc&take=2")
				.auth(accessToken, { type: "bearer" })
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
				.get("/playlists?sortBy=creationDate&order=desc")
				.auth(accessToken, { type: "bearer" })
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
				.post("/playlists")
				.send({
					name: "New Playlist",
					isPublic: true,
					allowChanges: true,
				})
				.auth(accessToken, { type: "bearer" })
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
				.post("/playlists")
				.auth(accessToken, { type: "bearer" })
				.send({
					name: dummyRepository.playlist1.name,
					isPublic: true,
					allowChanges: true,
				})
				.expect(HttpStatus.CONFLICT);
		});

		it("Should Error: need authentication", async () => {
			return request(app.getHttpServer())
				.post("/playlists")
				.send({
					name: dummyRepository.playlist1.name,
					isPublic: true,
					allowChanges: true,
				})
				.expect(HttpStatus.UNAUTHORIZED);
		});
	});

	describe("Update Playlist", () => {
		it("Should Rename Playlist", async () => {
			return request(app.getHttpServer())
				.put(`/playlists/${newPlaylist.slug}`)
				.auth(accessToken, { type: "bearer" })
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
				.auth(accessToken, { type: "bearer" })
				.send({
					name: dummyRepository.playlist3.name,
				})
				.expect(HttpStatus.CONFLICT);
		});

		it("Should Error: User is not an owner", async () => {
			return request(app.getHttpServer())
				.put(`/playlists/${newPlaylist.id}`)
				.auth(accessToken2, { type: "bearer" })
				.send({
					name: dummyRepository.playlist3.name,
				})
				.expect(HttpStatus.UNAUTHORIZED);
		});
	});

	describe("Delete Playlist", () => {
		it("Should Delete Playlist", async () => {
			await request(app.getHttpServer())
				.delete(`/playlists/${newPlaylist.id}`)
				.auth(accessToken, { type: "bearer" })
				.expect(200);
		});

		it("Should Error: Not the owner", async () => {
			await request(app.getHttpServer())
				.delete(`/playlists/${dummyRepository.playlist2.id}`)
				.auth(accessToken2, { type: "bearer" })
				.expect(401);
		});

		it("Should Error: Playlist Does not exist", async () => {
			await request(app.getHttpServer())
				.get(`/playlists/${newPlaylist.id}`)
				.auth(accessToken, { type: "bearer" })
				.expect(404);
		});
	});

	describe("Add Song To Playlist", () => {
		it("Should Add Song to Playlist Entry", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/${dummyRepository.playlist1.id}/entries`)
				.auth(accessToken, { type: "bearer" })
				.send({
					songId: dummyRepository.songB1.id,
				})
				.expect(201);
			const entries = await playlistService.getEntries(
				{
					id: dummyRepository.playlist1.id,
				},
				dummyRepository.user1.id,
			);
			expect(entries.length).toBe(4);
			expect(entries.at(3)!.index).toBe(
				dummyRepository.playlistEntry2.index + 1,
			);
			expect(entries.at(3)!.id).toBe(dummyRepository.songB1.id);
			await dummyRepository.playlistEntry.delete({
				where: { id: entries.at(3)!.entryId },
			});
		});

		it("Should Error: Song not found", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/${dummyRepository.playlist1.id}/entries`)
				.auth(accessToken, { type: "bearer" })
				.send({
					songId: -1,
				})
				.expect(404);
		});

		it("Should Error: Not the owner", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/${dummyRepository.playlist2.id}/entries`)
				.auth(accessToken2, { type: "bearer" })
				.send({
					songId: dummyRepository.songA1.id,
				})
				.expect(401);
		});

		it("Should Error: Playlist not Found", async () => {
			await request(app.getHttpServer())
				.post(`/playlists/${-1}/entries`)
				.auth(accessToken, { type: "bearer" })
				.send({
					songId: dummyRepository.songB1.id,
				})
				.expect(404);
		});
	});

	describe("Reorder Entry", () => {
		it("Should Error: Negative Number", async () => {
			await request(app.getHttpServer())
				.put(
					`/playlists/${dummyRepository.playlist1.id}/entries/reorder`,
				)
				.auth(accessToken, { type: "bearer" })
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
				.put(
					`/playlists/${dummyRepository.playlist1.id}/entries/reorder`,
				)
				.auth(accessToken, { type: "bearer" })
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
				.put(
					`/playlists/${dummyRepository.playlist1.id}/entries/reorder`,
				)
				.auth(accessToken, { type: "bearer" })
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
				.put(
					`/playlists/${dummyRepository.playlist1.id}/entries/reorder`,
				)
				.auth(accessToken, { type: "bearer" })
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						dummyRepository.playlistEntry2.id,
					],
				})
				.expect(400);
		});

		it("Should Error: Changes are not allowed", async () => {
			await request(app.getHttpServer())
				.put(
					`/playlists/${dummyRepository.playlist2.id}/entries/reorder`,
				)
				.auth(accessToken2, { type: "bearer" })
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						dummyRepository.playlistEntry3.id,
					],
				})
				.expect(401);
		});
		it("Should Move Entries", async () => {
			await request(app.getHttpServer())
				.put(
					`/playlists/${dummyRepository.playlist1.id}/entries/reorder`,
				)
				.auth(accessToken, { type: "bearer" })
				.send({
					entryIds: [
						dummyRepository.playlistEntry1.id,
						dummyRepository.playlistEntry2.id,
						dummyRepository.playlistEntry3.id,
					],
				})
				.expect(200);
			await request(app.getHttpServer())
				.get(`/playlists/${dummyRepository.playlist1.id}/entries`)
				.auth(accessToken, { type: "bearer" })
				.expect(200)
				.expect((res) => {
					const entries: Playlist = res.body.items;
					expect(entries).toStrictEqual([
						expectedPlaylistEntryResponse(
							dummyRepository.songA2,
							0,
							dummyRepository.playlistEntry1.id,
						),
						expectedPlaylistEntryResponse(
							dummyRepository.songA1,
							1,
							dummyRepository.playlistEntry2.id,
						),
						expectedPlaylistEntryResponse(
							dummyRepository.songC1,
							2,
							dummyRepository.playlistEntry3.id,
						),
					]);
				});
		});
	});

	describe("Delete Playlist Entry", () => {
		it("Should Move Entry", async () => {
			await request(app.getHttpServer())
				.delete(
					`/playlists/entries/${dummyRepository.playlistEntry2.id}`,
				)
				.auth(accessToken2, { type: "bearer" }) // not the owner but changes are allowed
				.expect(200);
		});

		it("Should Have Flattened Playlist", async () => {
			const entries = await playlistService.getEntries(
				{
					id: dummyRepository.playlist1.id,
				},
				dummyRepository.user1.id,
			);
			expect(entries.length).toBe(2);
			expect(entries).toContainEqual({
				entryId: dummyRepository.playlistEntry3.id,
				index: 1,
				...dummyRepository.songC1,
			});
			expect(entries).toContainEqual({
				entryId: dummyRepository.playlistEntry1.id,
				index: 0,
				...dummyRepository.songA2,
			});
		});

		it("Should Error: Entry not found", async () => {
			await request(app.getHttpServer())
				.delete(
					`/playlists/entries/${dummyRepository.playlistEntry2.id}`,
				)
				.auth(accessToken, { type: "bearer" })
				.expect(404);
		});
	});

	describe("Playlist Illustration", () => {
		it("Should return the illustration", async () => {
			const illustration = await dummyRepository.illustration.create({
				data: {
					playlist: { connect: { id: dummyRepository.playlist3.id } },
					type: IllustrationType.Cover,
					aspectRatio: 1,
					blurhash: "A",
					colors: ["B"],
				},
			});
			return request(app.getHttpServer())
				.get(
					`/playlists/${dummyRepository.playlist3.id}?with=illustration`,
				)
				.auth(accessToken, { type: "bearer" })
				.expect(200)
				.expect((res) => {
					const playlist: Playlist = res.body;
					expect(playlist).toStrictEqual({
						...playlist,
						illustration: {
							...illustration,
							url: `/illustrations/${illustration.id}`,
						},
					});
				});
		});

		it("Should not return the illustration (playlist is private)", async () => {
			return request(app.getHttpServer())
				.get(
					`/playlists/${dummyRepository.playlist3.id}?with=illustration`,
				)
				.expect(404);
		});
	});
});
