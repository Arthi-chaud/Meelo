import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import GeniusProvider from "./genius.provider";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpModule } from "@nestjs/axios";
import SettingsModule from "src/settings/settings.module";

describe('Genius Provider', () => {
	let geniusProvider: GeniusProvider;

	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [HttpModule, SettingsModule],
			providers: [GeniusProvider],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		geniusProvider = module.get(GeniusProvider);
		geniusProvider.onModuleInit();
	});
	describe('Get Artist Identifier', () => {
		it("should get simple artist Identifier", async () => {
			expect(await geniusProvider.getArtistIdentifier('Britney Spears'))
				.toBe("1052");
		});
		it("should get simple artist Identifier (2)", async () => {
			expect(await geniusProvider.getArtistIdentifier('Moloko'))
				.toBe("343316");
		});
		it("should get simple artist Identifier (3)", async () => {
			expect(await geniusProvider.getArtistIdentifier('Peplab'))
				.toBe("379198");
		});
		it("should get artist with special character Identifier", async () => {
			expect(await geniusProvider.getArtistIdentifier('P!nk'))
				.toBe("345");
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => geniusProvider.getArtistIdentifier("azertyuiop"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song Identifier', () => {
		it("should get simple song Identifier", async () => {
			expect(await geniusProvider.getSongIdentifier("Work B**ch", '1052'))
				.toBe("6547774");
		});
		it("should get simple song Identifier (2)", async () => {
			expect(await geniusProvider.getSongIdentifier("Work Bitch", '1052'))
				.toBe("218073");
		});
		it("should get simple song Identifier (2)", async () => {
			expect(await geniusProvider.getSongIdentifier('Fun For Me', '343316'))
				.toBe("1631056");
		});
		it("should get song with special character Identifier", async () => {
			expect(await geniusProvider.getSongIdentifier('M!ssundaztood', '345'))
				.toBe("195068");
		});
		it("should throw as the song does not have lyrics", async () => {
			expect(() => geniusProvider.getSongIdentifier('Drive', '379198'))
				.rejects.toThrow(ProviderActionFailedError);
		});
		it("should fail, as the song does not exist", () => {
			expect(() => geniusProvider.getSongIdentifier("azertyuiop", "345"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Artist Illustration', () => {
		it("should get artist illustration", async () => {
			expect(await geniusProvider.getArtistIllustrationUrl('345'))
				.toBe("https://images.genius.com/3ab61718877f5b1e7b119606361c92ad.522x522x1.jpg");
		});
		it("should get artist illustration", async () => {
			expect(await geniusProvider.getArtistIllustrationUrl('1052'))
				.toBe("https://images.genius.com/46f4e22f4dd38d21ca5e5edb9cd82331.900x900x1.jpg");
		});
		it("should fail, as the artist does not have an illustration", () => {
			expect(() => geniusProvider.getArtistIllustrationUrl("379198"))
				.rejects.toThrow(ProviderActionFailedError);
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => geniusProvider.getArtistIllustrationUrl("AZERTYUIOP"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	/*describe('Get Song Identifier', () => {
		it("should get song identifer", async () => {
			expect(await geniusProvider.getSongIdentifier("Funhouse", 'P-nk'))
				.toBe("P-nk-2/Funhouse");
		});
		it("should get song identifer (2)", async () => {
			expect(await geniusProvider.getSongIdentifier("Work Bitch", "Britney-Spears"))
				.toBe("Britney-Spears/Work-Bitch");
		});
		it("should fail, as the song does not exist", () => {
			expect(() => geniusProvider.getSongIdentifier("AZERTYUIOP", "Madonna"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song Lyrics', () => {
		it("should get song's lyrics", async () => {
			const lyrics = await geniusProvider.getSongLyrics("P-nk-2/Funhouse");
			expect(lyrics.startsWith("I dance around this empty house")).toBeTruthy();
			expect(lyrics.endsWith("I′m gonna burn it down, down, down\nI′m gonna burn it down")).toBeTruthy();
		});
		it("should fail, as the song does not exist", () => {
			expect(() => geniusProvider.getSongLyrics("AZERTYUIOP"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});*/
})