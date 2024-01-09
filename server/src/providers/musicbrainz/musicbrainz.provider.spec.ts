import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import MusicBrainzProvider from "./musicbrainz.provider";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";

describe("MusicBrainz Provider", () => {
	let musicBrainzProvider: MusicBrainzProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [MusicBrainzProvider],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		musicBrainzProvider = module.get(MusicBrainzProvider);
		musicBrainzProvider.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});
	describe("Get Provider's Wikidata Keys", () => {
		it("Should Get the correct Artist Metadata Key", () => {
			expect(
				musicBrainzProvider.getArtistWikidataIdentifierProperty(),
			).toBe("P434");
		});
		it("Should Get the correct Song Metadata Key", () => {
			expect(
				musicBrainzProvider.getSongWikidataIdentifierProperty(),
			).toBe("P435");
		});
		it("Should Get the correct Album Metadata Key", () => {
			expect(
				musicBrainzProvider.getAlbumWikidataIdentifierProperty(),
			).toBe("P436");
		});
	});
	describe("Get Artist Identifier", () => {
		it("should get simple artist Identifier", async () => {
			const id = await musicBrainzProvider.getArtistMetadataByName(
				"Britney Spears",
			);
			expect(id.value).toBe("45a663b5-b1cb-4a91-bff6-2bef7bbfdd76");
			expect(id.description).toBeNull();
		});
		it("should get simple artist Identifier", async () => {
			const id = await musicBrainzProvider.getArtistMetadataByName(
				"Adele",
			);
			expect(id.value).toBe("cc2c9c3c-b7bc-4b8b-84d8-4fbd8779e493");
			expect(id.description).toBeNull();
		});
		it("should get simple artist identifier", async () => {
			const id = await musicBrainzProvider.getArtistMetadataByName(
				"Moloko",
			);
			expect(id.value).toBe("2f94016a-3880-4d8c-9af9-0e197ee77189");
			expect(id.description).toBeNull();
		});
		it("should get artist with special character Identifier", async () => {
			const id = await musicBrainzProvider.getArtistMetadataByName(
				"P!nk",
			);
			expect(id.value).toBe("f4d5cc07-3bc9-4836-9b15-88a08359bc63");
			expect(id.description).toBeNull();
		});
		it("should fail, as the artist does not exist", () => {
			return expect(() =>
				musicBrainzProvider.getArtistMetadataByName("azertyuiop"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Song Identifier", () => {
		it("should get song Identifier", async () => {
			const id = await musicBrainzProvider.getSongMetadataByName(
				"Breathe On Me",
				"45a663b5-b1cb-4a91-bff6-2bef7bbfdd76",
			);
			expect(id.value).toBe("86b8e139-e31b-3bb9-9883-2f86e47b0e74");
			expect(id.description).toBeNull();
		});
		it("should get song Identifier (w/ Special chars)", async () => {
			const id = await musicBrainzProvider.getSongMetadataByName(
				"100%",
				"2f94016a-3880-4d8c-9af9-0e197ee77189",
			);
			expect(id.value).toBe("893fad96-434a-4c2d-a851-12bb10cfc823");
			expect(id.description).toBeNull();
		});
		it("should throw, as the artist does not exist", async () => {
			return expect(() =>
				musicBrainzProvider.getSongMetadataByName(
					"aerty",
					"Britney Spears",
				),
			).rejects.toThrow(ProviderActionFailedError);
		});
		it("should throw, as the song does not exist", async () => {
			return expect(() =>
				musicBrainzProvider.getSongMetadataByName(
					"AZERTY",
					"45a663b5-b1cb-4a91-bff6-2bef7bbfdd76",
				),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Album Identifier", () => {
		it("should get album Identifier", async () => {
			const id = await musicBrainzProvider.getAlbumMetadataByName(
				"Blackout",
				"45a663b5-b1cb-4a91-bff6-2bef7bbfdd76",
			);
			expect(id.value).toBe("0b8e14e1-d44d-3770-8617-5c6137a444a8");
			expect(id.description).toBeNull();
			expect(id.genres).toContain("Pop");
			expect(id.genres).toContain("Electronic");
			expect(id.genres).toContain("Dance-pop");
		});
		it("should get compilation album Identifier", async () => {
			const id = await musicBrainzProvider.getAlbumMetadataByName(
				"Nova Tunes 01",
			);
			expect(id.value).toBe("a6875c2b-3fc2-34b2-9eb6-3b73578a8ea8");
			expect(id.description).toBeNull();
			expect(id.genres).toStrictEqual([
				"Deep house",
				"Downtempo",
				"Electronic",
				"Trip hop",
			]);
		});
		it("should throw, as the album does not exist", () => {
			return expect(() =>
				musicBrainzProvider.getAlbumMetadataByName(
					"AZERTY",
					"45a663b5-b1cb-4a91-bff6-2bef7bbfdd76",
				),
			).rejects.toThrow(ProviderActionFailedError);
		});
		it("should throw, as the artist does not exist", () => {
			return expect(() =>
				musicBrainzProvider.getAlbumMetadataByName(
					"aerty",
					"Britney Spears",
				),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	/*describe('Get Album Type', () => {
		describe('Simple', () => {
			it("should return Studio Recording", async () => {
				// Standard Studio Recording
				const albumType = await musicBrainzProvider.getAlbumType('c58894f6-ff01-3bbd-afa5-4eb54aec6dab')
				expect(albumType).toBe(AlbumType.StudioRecording);
			});
			it("should return Live", async () => {
				// Live Album
				const albumType = await musicBrainzProvider.getAlbumType('47e4706a-4178-37f4-a4b9-043906ef0b59')
				expect(albumType).toBe(AlbumType.LiveRecording);
			})
			it("should return Compilation", async () => {
				// Compilation album
				const albumType = await musicBrainzProvider.getAlbumType('bd252c17-ff32-4369-8e73-4d0a65a316bd')
				expect(albumType).toBe(AlbumType.Compilation);
			})
			it("should return Single", async () => {
				// Standard Single
				const albumType = await musicBrainzProvider.getAlbumType('70d97b9e-8eec-4ae1-a301-81e530fc389d')
				expect(albumType).toBe(AlbumType.Single);
			});
			it("should return Single, for an EP", async () => {
				// EP
				const albumType = await musicBrainzProvider.getAlbumType('f7389c03-a459-3d0d-8718-99f66d761c16')
				expect(albumType).toBe(AlbumType.Single);
			});
			it("should return Soundtrack", async () => {
				// Standard Soundtrack album
				const albumType = await musicBrainzProvider.getAlbumType('240a3a12-1b3f-3a1c-ab98-147f3a2d2af1')
				expect(albumType).toBe(AlbumType.Soundtrack);
			})
			it("should return Remix Album", async () => {
				// DJ Mix
				const albumType = await musicBrainzProvider.getAlbumType('ce018797-8764-34f8-aee4-10089fc7393d')
				expect(albumType).toBe(AlbumType.RemixAlbum);
			})
			it("should return Remix Album", async () => {
				// Remix compilation
				const albumType = await musicBrainzProvider.getAlbumType('664197fb-1e5c-4687-9bf4-a178bc2fd68e')
				expect(albumType).toBe(AlbumType.RemixAlbum);
			})
		});

		describe('Types Combinations', () => {
			it("should return Remix Album", async () => {
				// Remixe Compilation
				const albumType = await musicBrainzProvider.getAlbumType('86def221-c6fc-452b-9596-cb210cbfdd0b')
				expect(albumType).toBe(AlbumType.RemixAlbum);
			});
			it("should return Single", async () => {
				// Single from Soundtrack
				const albumType = await musicBrainzProvider.getAlbumType('4a5f1d42-cf14-4948-8702-76154644a825')
				expect(albumType).toBe(AlbumType.Single);
			})
			
			it("should return Single", async () => {
				// EP Compilation
				const albumType = await musicBrainzProvider.getAlbumType('d7a8ca59-6243-4171-8247-18634344057b')
				expect(albumType).toBe(AlbumType.Compilation);
			})
		});
		it("should throw, as the album does not exist", () => {
			return expect(() => musicBrainzProvider.getAlbumType("AZERTY"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});*/
});
