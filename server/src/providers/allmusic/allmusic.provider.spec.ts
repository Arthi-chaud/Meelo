import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";
import { ProviderActionFailedError } from "../provider.exception";
import AllMusicProvider from "./allmusic.provider";

describe("All Music Provider", () => {
	let allMusicProvider: AllMusicProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [AllMusicProvider],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		allMusicProvider = module.get(AllMusicProvider);
		allMusicProvider.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	describe("Get Resource URLs", () => {
		it("Should Get Rating", async () => {
			const metadata =
				await allMusicProvider.getAlbumMetadataByIdentifier(
					"mw0000356345",
				);

			expect(metadata.value).toBe("mw0000356345");
			expect(metadata.rating).toBe(70);
			expect(metadata.description).toBeNull();
		});
		it("Should Get Null Rating", async () => {
			const metadata =
				await allMusicProvider.getAlbumMetadataByIdentifier(
					"mw0000770491",
				);

			expect(metadata.value).toBe("mw0000770491");
			expect(metadata.rating).toBeNull();
			expect(metadata.description).toBeNull();
		});
		it("Should throw, as the page does not exist", async () => {
			expect(
				allMusicProvider.getAlbumMetadataByIdentifier("zzz"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});
});
