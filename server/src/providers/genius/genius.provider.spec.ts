import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import GeniusProvider from "./genius.provider";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";

describe("Genius Provider", () => {
	let geniusProvider: GeniusProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [GeniusProvider],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		geniusProvider = module.get(GeniusProvider);
		geniusProvider.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	describe("Get Artist Identifier", () => {
		it("should get simple artist Identifier", async () => {
			const metadata = await geniusProvider.getArtistMetadataByName(
				"Britney Spears",
			);
			expect(metadata.value).toBe("Britney-spears");
			expect(metadata.description).not.toBeNull();
		});
		it("should get simple artist Identifier (2)", async () => {
			const metadata = await geniusProvider.getArtistMetadataByName(
				"Moloko",
			);
			expect(metadata.value).toBe("Moloko");
			expect(metadata.description).not.toBeNull();
		});
		it("should get simple artist Identifier (3)", async () => {
			const metadata = await geniusProvider.getArtistMetadataByName(
				"Peplab",
			);
			expect(metadata.value).toBe("Peplab");
			expect(metadata.description).toBeNull();
		});
		it("should get artist with special character Identifier", async () => {
			const metadata = await geniusProvider.getArtistMetadataByName(
				"P!nk",
			);
			expect(metadata.value).toBe("P-nk");
			expect(metadata.illustration).toBe(
				"https://images.genius.com/8e9d7b2c7e977c8009872f1b28d369c0.474x474x1.jpg",
			);
			expect(metadata.description).not.toBeNull();
		});
		it("should get artist with special character Identifier (1)", async () => {
			const metadata = await geniusProvider.getArtistMetadataByName(
				"Björk",
			);
			expect(metadata.value).toBe("Bjork");
			expect(metadata.description).not.toBeNull();
		});
		it("should fail, as the artist does not exist", () => {
			return expect(() =>
				geniusProvider.getArtistMetadataByName("azertyuiop"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Artist URL", () => {
		it("Should format the URL for the artist", () => {
			expect(geniusProvider.getArtistURL("P-nk")).toBe(
				"https://genius.com/artists/P-nk",
			);
		});
	});

	describe("Get Song Identifier", () => {
		it("should get simple song Identifier", async () => {
			const metadata = await geniusProvider.getSongMetadataByName(
				"Work B**ch",
				"Britney-spears",
			);
			expect(metadata.value).toBe("Britney-spears-work-bch-work-work");
			expect(metadata.description).toBeNull();
		});
		it("should get simple song Identifier", async () => {
			const metadata = await geniusProvider.getSongMetadataByName(
				"Overrated",
				"Siobhan-donaghy",
			);
			expect(metadata.value).toBe("Siobhan-donaghy-overrated");
			expect(metadata.description).toBeNull();
		});
		it("should get simple song Identifier", async () => {
			const metadata = await geniusProvider.getSongMetadataByName(
				"Anti-Hero",
				"Taylor-swift",
			);
			expect(metadata.value).toBe("Taylor-swift-anti-hero");
			expect(metadata.description).toBeNull();
		});
		it("should get simple song Identifier (2)", async () => {
			const metadata = await geniusProvider.getSongMetadataByName(
				"Work Bitch",
				"Britney-spears",
			);
			expect(metadata.value).toBe("Britney-spears-work-bitch");
			expect(metadata.description).toBeNull();
		});
		it("should get simple song Identifier (2)", async () => {
			const metadata = await geniusProvider.getSongMetadataByName(
				"Fun For Me",
				"Moloko",
			);
			expect(metadata.value).toBe("Moloko-fun-for-me");
			expect(metadata.description).toBeNull();
		});
		it("should get song with special character Identifier", async () => {
			const metadata = await geniusProvider.getSongMetadataByName(
				"M!ssundaztood",
				"P-nk",
			);
			expect(metadata.value).toBe("P-nk-m-ssundaztood");
			expect(metadata.description).toBeNull();
		});
		it("should fail, as the song does not exist", () => {
			return expect(() =>
				geniusProvider.getSongMetadataByName("azertyuiop", "azryu"),
			).rejects.toThrow(ProviderActionFailedError);
		});
		it("should throw as the song does not exist (1)", async () => {
			return expect(() =>
				geniusProvider.getSongMetadataByName("Drive", "Peplab"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Song URL", () => {
		it("Should format the URL for the song", () => {
			expect(geniusProvider.getSongURL("Moloko-fun-for-me")).toBe(
				"https://genius.com/Moloko-fun-for-me-lyrics",
			);
		});
	});

	describe("Get Song Lyrics", () => {
		//Skipping this tes tin CI as Action runner has been flagged as robot by Genius
		if (process.env.GITHUB_ACTIONS != "true") {
			it("should get song's lyrics", async () => {
				const lyrics = await geniusProvider.getSongLyrics(
					"P-nk-m-ssundaztood",
				);

				expect(
					lyrics.startsWith(
						"[Intro]\nGo Damon\nGo Linda\nGo P!nk\nHaha, yeah\nIt's me\n",
					),
				).toBeTruthy();
				expect(
					lyrics.includes("Exlax commercial?\nWhat? [Laughs]\n"),
				).toBeTruthy();
			});
		}
		it("should fail, as the song does not exist", () => {
			return expect(() =>
				geniusProvider.getSongLyrics("azertyuiopazertyui"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Album URL", () => {
		it("Should format the URL for the Album", () => {
			expect(geniusProvider.getAlbumURL("Madonna/Ray-of-light")).toBe(
				"https://genius.com/albums/Madonna/Ray-of-light",
			);
		});
	});

	describe("Get Artist Description", () => {
		it("should get artist's description", async () => {
			const { description } =
				await geniusProvider.getArtistMetadataByIdentifier("Madonna");

			expect(description).not.toBeNull();
			expect(
				description!.startsWith(
					"With more than 335 million copies of her albums sold, Madonna is the most successful female artist of all time.",
				),
			).toBeTruthy();
			expect(
				description!.endsWith(
					"female empowerment and the search for fame.",
				),
			).toBeTruthy();
		});
	});
});
