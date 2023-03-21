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
				.toBe('Britney-spears');
		});
		it("should get simple artist Identifier (2)", async () => {
			expect(await geniusProvider.getArtistIdentifier('Moloko'))
				.toBe('Moloko');
		});
		it("should get simple artist Identifier (3)", async () => {
			expect(await geniusProvider.getArtistIdentifier('Peplab'))
				.toBe('Peplab');
		});
		it("should get artist with special character Identifier", async () => {
			expect(await geniusProvider.getArtistIdentifier('P!nk'))
				.toBe('P-nk');
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => geniusProvider.getArtistIdentifier("azertyuiop"))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Artist URL', () => {
		it("Should format the URL for the artist", () => {
			expect(geniusProvider.getArtistURL('P-nk'))
				.toBe("https://genius.com/artists/P-nk");
		})
	});

	describe('Get Song Identifier', () => {
		it("should get simple song Identifier", async () => {
			expect(await geniusProvider.getSongIdentifier("Work B**ch", 'Britney-spears'))
				.toBe('Britney-spears-work-bch-clean-version');
		});
		it("should get simple song Identifier (2)", async () => {
			expect(await geniusProvider.getSongIdentifier("Work Bitch", 'Britney-spears'))
				.toBe('Britney-spears-work-bitch');
		});
		it("should get simple song Identifier (2)", async () => {
			expect(await geniusProvider.getSongIdentifier('Fun For Me', 'Moloko'))
				.toBe('Moloko-fun-for-me');
		});
		it("should get song with special character Identifier", async () => {
			expect(await geniusProvider.getSongIdentifier('M!ssundaztood', 'P-nk'))
				.toBe('P-nk-m-ssundaztood');
		});
		it("should fail, as the song does not exist", () => {
			expect(() => geniusProvider.getSongIdentifier("azertyuiop", 'azryu'))
			.rejects.toThrow(ProviderActionFailedError);
		});
		it("should throw as the song does not exist (1)", async () => {
			expect(() => geniusProvider.getSongIdentifier('Drive', 'Peplab'))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song URL', () => {
		it("Should format the URL for the song", () => {
			expect(geniusProvider.getSongURL('Moloko-fun-for-me'))
				.toBe("https://genius.com/Moloko-fun-for-me-lyrics");
		})
	});

	describe('Get Artist Illustration', () => {
		it("should get artist illustration", async () => {
			expect(await geniusProvider.getArtistIllustrationUrl('P-nk'))
				.toBe("https://images.genius.com/3ab61718877f5b1e7b119606361c92ad.522x522x1.jpg");
		});
		it("should get artist illustration", async () => {
			expect(await geniusProvider.getArtistIllustrationUrl('Britney-spears'))
				.toBe("https://images.genius.com/46f4e22f4dd38d21ca5e5edb9cd82331.900x900x1.jpg");
		});
		it("should fail, as the artist does not have an illustration", () => {
			expect(() => geniusProvider.getArtistIllustrationUrl('Peplab'))
				.rejects.toThrow(ProviderActionFailedError);
		});
		it("should fail, as the artist does not exist", () => {
			expect(() => geniusProvider.getArtistIllustrationUrl('azertyugfdzaqsdbn'))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Song Lyrics', () => {
		//Skipping this tes tin CI as Action runner has been flagged as robot by Genius
		if (process.env.GITHUB_ACTIONS != 'true') {
			it("should get song's lyrics", async () => {
				const lyrics = await geniusProvider.getSongLyrics('P-nk-m-ssundaztood');
	
				expect(lyrics.startsWith("[Intro]\nGo Damon\nGo Linda\nGo P!nk\nHaha, yeah\nIt's me\n")).toBeTruthy();
				expect(lyrics.includes("Exlax commercial?\nWhat? [Laughs]\n")).toBeTruthy();
			});
		}
		it("should fail, as the song does not exist", () => {
			expect(() => geniusProvider.getSongLyrics('azertyuiopazertyui'))
				.rejects.toThrow(ProviderActionFailedError);
		});
	});

	describe('Get Album Identifier', () => {
		//Skipping this tes tin CI as Action runner has been flagged as robot by Genius
		if (process.env.GITHUB_ACTIONS != 'true') {
			it("should get album's Identifier (1)", async () => {
				expect(await geniusProvider.getAlbumIdentifier("Ray of Light - Single", 'Madonna'))
					.toBe('Madonna/Ray-of-light-single-remixes')
			});
			it("should get album's Identifier (2)", async () => {
				expect(await geniusProvider.getAlbumIdentifier("Pink Friday: Roman Reloaded", 'Nicki-minaj'))
					.toBe('Nicki-minaj/Pink-friday-roman-reloaded')
			});
			it("should throw as the album does not exist", async () => {
				expect(() => geniusProvider.getAlbumIdentifier("AZERTYUIOP", 'azert'))
					.rejects.toThrow(ProviderActionFailedError);
			});
		}
	});

	describe('Get Album Description', () => {
		it("should get album's description (1)", async () => {
			const description = await geniusProvider.getAlbumDescription('Nicki-minaj/Pink-friday-roman-reloaded');

			expect(description.startsWith("Pink Friday: Roman Reloaded was released April 2, 2012, and is Nicki’s second LP. It made it to number 1 on the Billboard charts, ")).toBeTruthy();
			expect(description.endsWith("blatantly stated that this is a “rap album,” her pop sensibilities are also on full display.")).toBeTruthy();
		});
		it("should get album's description (2)", async () => {
			const description = await geniusProvider.getAlbumDescription('P-nk/m-ssundaztood');

			expect(description.startsWith("Missundaztood is the second studio album by P!nk. The album was a success worldwide and with critics, selling thirteen million copies")).toBeTruthy();
			expect(description.endsWith('“Get the Party Started”, “Don’t Let Me Get Me”, “Just like a Pill”, and “Family Portrait”. The album is P!nk’s best-selling album to date and rose her into international stardom.')).toBeTruthy();
		});
	});

	describe('Get Album URL', () => {
		it("Should format the URL for the Album", () => {
			expect(geniusProvider.getAlbumURL('Madonna/Ray-of-light'))
				.toBe("https://genius.com/albums/Madonna/Ray-of-light");
		})
	});

	describe('Get Artist Description', () => {
		it("should get artist's description", async () => {
			const description = await geniusProvider.getArtistDescription('Madonna');

			expect(description.startsWith("With more than 335 million copies of her albums sold, Madonna is the most successful female artist of all time.")).toBeTruthy();
			expect(description.endsWith("female empowerment and the search for fame.")).toBeTruthy();
		});
	});
})