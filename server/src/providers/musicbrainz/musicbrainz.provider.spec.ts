import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import MusicBrainzProvider from "./musicbrainz.provider";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";

describe('MusicBrainz Provider', () => {
	let musicBrainzProvider: MusicBrainzProvider;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [MusicBrainzProvider],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		musicBrainzProvider = module.get(MusicBrainzProvider);
		musicBrainzProvider.onModuleInit();
	});
	describe('Get Artist Identifier', () => {
		it("should get simple artist Identifier", async () => {
			expect(await musicBrainzProvider.getArtistIdentifier('Britney Spears'))
				.toBe("45a663b5-b1cb-4a91-bff6-2bef7bbfdd76");
		});
		it("should get simple artist Identifier", async () => {
			expect(await musicBrainzProvider.getArtistIdentifier('Adele'))
				.toBe("cc2c9c3c-b7bc-4b8b-84d8-4fbd8779e493");
		});
		it("should get simple artist identifier", async () => {
			expect(await musicBrainzProvider.getArtistIdentifier('Moloko'))
				.toBe("2f94016a-3880-4d8c-9af9-0e197ee77189");
		});
		it("should get artist with special character Identifier", async () => {
			expect(await musicBrainzProvider.getArtistIdentifier('P!nk'))
				.toBe("f4d5cc07-3bc9-4836-9b15-88a08359bc63");
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => musicBrainzProvider.getArtistIdentifier("azertyuiop"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song Identifier', () => {
		it("should get song Identifier", async () => {
			expect(await musicBrainzProvider.getSongIdentifier("Breathe On Me", "45a663b5-b1cb-4a91-bff6-2bef7bbfdd76"))
				.toBe("86b8e139-e31b-3bb9-9883-2f86e47b0e74");
		});
		it("should get song Identifier (w/ Special chars)", async () => {
			expect(await musicBrainzProvider.getSongIdentifier('100%', '2f94016a-3880-4d8c-9af9-0e197ee77189'))
				.toBe("893fad96-434a-4c2d-a851-12bb10cfc823");
		});
		it("should throw, as the artist does not exist", async () => {
			expect(() => musicBrainzProvider.getSongIdentifier('aerty', 'Britney Spears'))
				.rejects.toThrow(ProviderActionFailedError);
		});
		it("should throw, as the song does not exist", async () => {
			expect(() => musicBrainzProvider.getSongIdentifier("AZERTY", "45a663b5-b1cb-4a91-bff6-2bef7bbfdd76"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Album Identifier', () => {
		it("should get album Identifier", async () => {
			expect(await musicBrainzProvider.getAlbumIdentifier("Blackout", "45a663b5-b1cb-4a91-bff6-2bef7bbfdd76"))
			.toBe("0b8e14e1-d44d-3770-8617-5c6137a444a8");
		});
		it("should get compilation album Identifier", async () => {
			expect(await musicBrainzProvider.getAlbumIdentifier("Nova Tunes 01"))
				.toBe("a6875c2b-3fc2-34b2-9eb6-3b73578a8ea8");
		});
		it("should throw, as the album does not exist", () => {
			expect(() => musicBrainzProvider.getAlbumIdentifier("AZERTY", "45a663b5-b1cb-4a91-bff6-2bef7bbfdd76"))
				.rejects.toThrow(ProviderActionFailedError);
		});
		it("should throw, as the artist does not exist", () => {
			expect(() => musicBrainzProvider.getAlbumIdentifier('aerty', 'Britney Spears'))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Album Description', () => {
		it("should get album description", async () => {
			const description = await musicBrainzProvider.getAlbumDescription("b59f1cf2-b3f7-341c-963f-acd0c19d5e96");

			expect(description.startsWith('Do You Like My Tight Sweater? is the first album by the electronic/dance duo Moloko, ')).toBeTruthy();
			expect(description.includes('("Where Is the What If the What Is in Why?", "Party Weirdo", and "Ho Humm")')).toBeTruthy();
			expect(description.endsWith('Industry in July 2013, for UK sales exceeding 60,000 copies.')).toBeTruthy();
		});
		it("should throw, as the album does not exist", () => {
			expect(() => musicBrainzProvider.getAlbumDescription("AZERTY"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	})

	describe('Get Artist Description', () => {
		it("should get Artist description", async () => {
			const description = await musicBrainzProvider.getArtistDescription("3bdf5095-d3a7-4652-aedc-313132174f44");

			expect(description.startsWith('Siobhán Emma Donaghy (born 14 June 1984) is an English-Irish singer and songwriter. ')).toBeTruthy();
			expect(description.endsWith('rights to the Sugababes name again in 2019.')).toBeTruthy();
		});
		it("should throw, as the Artist does not exist", () => {
			expect(() => musicBrainzProvider.getArtistDescription("AZERTY"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	})
})