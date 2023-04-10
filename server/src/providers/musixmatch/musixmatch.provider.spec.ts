/*import { TestingModule } from "@nestjs/testing";
import PrismaService from "src/prisma/prisma.service";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import MusixMatchProvider from "./musixmatch.provider";
import { ProviderActionFailedError } from "../provider.exception";
import { HttpModule } from "@nestjs/axios";

describe('MusixMatch Provider', () => {
	let musixmatchProvider: MusixMatchProvider;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [HttpModule],
			providers: [MusixMatchProvider],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		musixmatchProvider = module.get(MusixMatchProvider);
	});
	describe('Get Artist Identifier', () => {
		it("should get simple artist Identifier", async () => {
			expect(await musixmatchProvider.getArtistIdentifier('Britney Spears'))
				.toBe("Britney-Spears");
		});
		it("should get artist with special character Identifier", async () => {
			expect(await musixmatchProvider.getArtistIdentifier('P!nk'))
				.toBe("P-nk");
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => musixmatchProvider.getArtistIdentifier("azertyuiop"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Artist Illustration', () => {
		it("should get artist illustration", async () => {
			expect(await musixmatchProvider.getArtistIllustrationUrl('Britney-Spears'))
				.toBe("https://static.musixmatch.com/images-storage/mxmimages/0/3/3/0/0/2/43200330_14.jpg");
		});
		it("should get artist illustration (2)", async () => {
			expect(await musixmatchProvider.getArtistIllustrationUrl('P-nk'))
				.toBe("https://static.musixmatch.com/images-storage/mxmimages/9/6/7/0/1/10769_14.jpg");
		});
		it("should get artist illustration (3)", async () => {
			expect(await musixmatchProvider.getArtistIllustrationUrl('Christina-Aguilera'))
				.toBe("https://static.musixmatch.com/images-storage/mxmimages/7/2/7/7/3/37727_14.jpg");
		});
		it("should fail, as the artist does not have an illustration", () => {
			expect(() => musixmatchProvider.getArtistIllustrationUrl("osunlade"))
				.rejects.toThrow(ProviderActionFailedError);
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => musixmatchProvider.getArtistIllustrationUrl("AZERTYUIOP"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song Identifier', () => {
		it("should get song identifer", async () => {
			expect(await musixmatchProvider.getSongIdentifier("Funhouse", 'P-nk'))
				.toBe("P-nk-2/Funhouse");
		});
		it("should get song identifer (2)", async () => {
			expect(await musixmatchProvider.getSongIdentifier("Work Bitch", "Britney-Spears"))
				.toBe("Britney-Spears/Work-Bitch");
		});
		it("should fail, as the song does not exist", () => {
			expect(() => musixmatchProvider.getSongIdentifier("AZERTYUIOP", "Madonna"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song Lyrics', () => {
		it("should get song's lyrics", async () => {
			const lyrics = await musixmatchProvider.getSongLyrics("P-nk-2/Funhouse");
			expect(lyrics.startsWith("I dance around this empty house")).toBeTruthy();
			expect(lyrics.endsWith("I′m gonna burn it down, down, down\nI′m gonna burn it down")).toBeTruthy();
		});
		it("should fail, as the song does not exist", () => {
			expect(() => musixmatchProvider.getSongLyrics("AZERTYUIOP"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});
})*/

test('skip', () => {});