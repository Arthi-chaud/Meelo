import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";
import MetacriticProvider from "./metacritic.provider";
import { ProviderActionFailedError } from "../provider.exception";

describe("Metacritic Provider", () => {
	let metacriticProvider: MetacriticProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [MetacriticProvider],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		metacriticProvider = module.get(MetacriticProvider);
		metacriticProvider.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
	});

	describe("Get Resources URLs", () => {
		it("Should format the URL for the album", () => {
			expect(
				metacriticProvider.getAlbumURL("music/midnights/taylor-swift"),
			).toBe("https://www.metacritic.com/music/midnights/taylor-swift");
		});
	});

	describe("Get Resource URLs", () => {
		it("Should Get Rating and description", async () => {
			const metadata =
				await metacriticProvider.getAlbumMetadataByIdentifier(
					"music/confessions-on-a-dance-floor/madonna",
				);

			expect(metadata.value).toBe(
				"music/confessions-on-a-dance-floor/madonna",
			);
			expect(metadata.rating).toBe(80);
			expect(metadata.description).toBe(
				"Stuart Price co-produced the 47-year-old Anglophile's latest dance-oriented effort.",
			);
		});
		it("Should throw, as the page does not exist", async () => {
			return expect(
				metacriticProvider.getAlbumMetadataByIdentifier("zzz"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});
});
