import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";
import DiscogsProvider from "./discogs.provider";
import { ProviderActionFailedError } from "../provider.exception";

describe("Discogs Provider", () => {
	let discogsProvider: DiscogsProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [DiscogsProvider],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		discogsProvider = module.get(DiscogsProvider);
		discogsProvider.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	describe("Get Resources URLs", () => {
		it("Should format the URL for the artist", () => {
			expect(discogsProvider.getArtistURL("21994")).toBe(
				"https://www.discogs.com/artist/21994",
			);
		});
		it("Should format the URL for the album", () => {
			expect(discogsProvider.getAlbumURL("50297")).toBe(
				"https://www.discogs.com/master/50297",
			);
		});
		it("should build the correct URL", () => {
			expect(discogsProvider.getReleaseURL("123456")).toBe(
				"https://www.discogs.com/release/123456",
			);
		});
	});

	describe("Get Artist Metadata", () => {
		it("Should Get artist Metadata by Identifier", async () => {
			const metadata =
				await discogsProvider.getArtistMetadataByIdentifier("21994");
			expect(metadata.value).toBe("21994");
			expect(metadata.description).not.toBeNull();
			expect(metadata!.description).toContain(
				"One of the best-selling female pop groups from the UK.",
			);
		});
		it("Should throw, as the artist does not exist", () => {
			return expect(
				discogsProvider.getArtistMetadataByIdentifier("-1"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Album Metadata", () => {
		it("Should Get album Metadata by Identifier", async () => {
			const metadata = await discogsProvider.getAlbumMetadataByIdentifier(
				"24744",
			);
			expect(metadata.value).toBe("24744");
			expect(metadata.genres).toContain("Electronic");
			expect(metadata.genres).toContain("Rock");
			// expect(metadata!.description).toContain(
			// 	"Exciter is the tenth studio album by English electronic music band Depeche Mode",
			// );
		});
		it("Should throw, as the album does not exist", () => {
			return expect(
				discogsProvider.getAlbumMetadataByIdentifier("-1"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Release Metadata", () => {
		it("Should Get Release Metadata by Identifier", async () => {
			const metadata =
				await discogsProvider.getReleaseMetadataByIdentifier("9442778");
			expect(metadata.value).toBe("9442778");
			// expect(metadata!.description).toContain(
			// 	"Comes with a printed inner sleeve with lyrics, credits and photos.",
			// );
		});
		it("Should throw, as the Release does not exist", () => {
			return expect(
				discogsProvider.getReleaseMetadataByIdentifier("-1"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});
});