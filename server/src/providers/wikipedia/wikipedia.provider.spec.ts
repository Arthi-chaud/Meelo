import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import WikipediaProvider from "./wikipedia.provider";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";

describe("Wikipedia Provider", () => {
	let wikipediaProvider: WikipediaProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [WikipediaProvider],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		wikipediaProvider = module.get(WikipediaProvider);
		wikipediaProvider.onModuleInit();
	});

	afterAll(() => {
		module.close();
	});

	describe("Get Artist Metadata", () => {
		it("should get Artist", async () => {
			const { value, description } =
				await wikipediaProvider.getResourceMetadataByWikidataId(
					"Q236240",
				);

			expect(value).toBe("Siobhán Donaghy");
			expect(description).not.toBeNull();
			expect(
				description!.startsWith(
					"Siobhán Emma Donaghy (born 14 June 1984)",
				),
			).toBeTruthy();
			expect(
				description!.endsWith(
					"rights to the Sugababes name again in 2019.",
				),
			).toBeTruthy();
		});
		it("should throw, as the Artist does not exist", () => {
			expect(() =>
				wikipediaProvider.getResourceMetadataByWikidataId("AZERTY"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe("Get Album", () => {
		it("should get album", async () => {
			const { value, description } =
				await wikipediaProvider.getResourceMetadataByWikidataId(
					"Q834865",
				);

			expect(value).toBe("Do You Like My Tight Sweater?");
			expect(description).not.toBeNull();
			expect(
				description!.startsWith(
					"Do You Like My Tight Sweater? is the first album by the electronic/dance duo Moloko, ",
				),
			).toBeTruthy();
			expect(
				description!.includes(
					'("Where Is the What If the What Is in Why?", "Party Weirdo", and "Ho Humm")',
				),
			).toBeTruthy();
			expect(
				description!.endsWith(
					"Industry in July 2013, for UK sales exceeding 60,000 copies.",
				),
			).toBeTruthy();
		});
		it("should throw, as the album does not exist", () => {
			expect(() =>
				wikipediaProvider.getResourceMetadataByWikidataId("AZERTY"),
			).rejects.toThrow(ProviderActionFailedError);
		});
	});
});
