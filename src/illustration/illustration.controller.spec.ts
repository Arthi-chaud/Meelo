import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import FileManagerService from "src/file-manager/file-manager.service";
import PrismaService from "src/prisma/prisma.service";
import { FakeFileManagerService } from "test/fake-file-manager.module";
import PrismaModule from "src/prisma/prisma.module";
import TestPrismaService from "test/test-prisma.service";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import MetadataModule from "src/metadata/metadata.module";
import AlbumModule from "src/album/album.module";
import FileModule from "src/file/file.module";
import GenreModule from "src/genre/genre.module";
import { LyricsModule } from "src/lyrics/lyrics.module";
import ReleaseModule from "src/release/release.module";
import SongModule from "src/song/song.module";
import TrackModule from "src/track/track.module";
// Import as a require to mock
const fs = require('fs');
import { INestApplication, ValidationPipe } from "@nestjs/common";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import request from "supertest";
import ReleaseService from "src/release/release.service";
import TrackService from "src/track/track.service";
describe('Illustration Controller', () => {
	let app: INestApplication;
	let dummyRepository: TestPrismaService;
	let fileManagerService: FakeFileManagerService;
	let releaseService: ReleaseService;
	let trackService: TrackService;
	beforeAll(async () => {
		const module: TestingModule = await createTestingModule({
			imports: [FileManagerModule, PrismaModule, FileModule, MetadataModule, FileManagerModule, FileModule, ArtistModule, AlbumModule, SongModule, ReleaseModule, TrackModule, GenreModule, LyricsModule],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService)
		.overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = module.createNestApplication();
		app.useGlobalFilters(
			new NotFoundExceptionFilter(),
			new MeeloExceptionFilter()
		);
		app.useGlobalPipes(new ValidationPipe());
		fileManagerService = module.get<FileManagerService>(FileManagerService);
		await app.init();
		dummyRepository = module.get(PrismaService);
		releaseService = module.get(ReleaseService);
		trackService = module.get(TrackService);
		await dummyRepository.onModuleInit();
	});

	const expectedFileName = (headers: any, expected: string) => {
		expect(headers['content-disposition']).toStrictEqual(`attachment; filename="${expected}.jpg"`);
	}

	const getDummyIllustrationStream = () => fs.createReadStream('test/assets/settings.json');
	const dummyIllustrationBytes = fs.readFileSync('test/assets/settings.json');

	const illustrationUrlExample = 'https://i.discogs.com/VEV-yWsS3J9SfeTVaY8Q_3Bw3dWqHHgf2WLDL5mGqxo/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTY2Ny0x/NjY1NDkzNDk3LTQ2/MDYuanBlZw.jpeg'
	// const distantIllustrationContent = axios.get(illustrationUrlExample).then((r) => r.data);

	const illustration2UrlExample = 'https://i.discogs.com/OoRFxbWuLADDqiPFOUU_7t9k5P1Zui3V__PsTXd_LYo/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTY2Ny0x/NjY2NTM3ODUxLTIz/NzQuanBlZw.jpeg';
	// const distantIllustration2Content = axios.get(illustration2UrlExample).then((r) => r.data);

	describe("Get Artist Illustration", () => {
		it("should return the artist illustration", () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(getDummyIllustrationStream());
			return request(app.getHttpServer())
				.get(`/illustrations/artists/${dummyRepository.artistA.id}`)
				.expect(200)
				.expect((res) => {
					expectedFileName(res.headers, dummyRepository.artistA.slug);
					expect(res.body).toStrictEqual(dummyIllustrationBytes);
				});
		});
		it("should return 404, when artist does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/artists/-1`)
				.expect(404);
		})
		it("should return 404, when artist illustration does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/artists/${dummyRepository.artistA.id}`)
				.expect(404);
		});
	});

	describe("Get Album Illustration", () => {
		it("should return the master release illustration", () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(getDummyIllustrationStream());
			return request(app.getHttpServer())
				.get(`/illustrations/albums/${dummyRepository.albumB1.id}`)
				.expect(200)
				.expect((res) => {
					expectedFileName(res.headers, dummyRepository.releaseB1_1.slug);
					expect(res.body).toStrictEqual(dummyIllustrationBytes);
				});
		});
		it("should return 404, when album does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/artists/-1`)
				.expect(404);
		})
		it("should return 404, when album illustration does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/albums/${dummyRepository.albumA1.id}`)
				.expect(404)
		});
	});

	describe("Get Release Illustration", () => {
		it("should return the release illustration", () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(getDummyIllustrationStream());
			return request(app.getHttpServer())
				.get(`/illustrations/releases/${dummyRepository.releaseA1_1.id}`)
				.expect(200)
				.expect((res) => {
					expectedFileName(res.headers, dummyRepository.releaseA1_1.slug);
					expect(res.body).toStrictEqual(dummyIllustrationBytes);
				});
		});
		it("should return 404, when release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/releases/-1`)
				.expect(404)
		})
		it("should return 404, when release illustration does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/releases/${dummyRepository.releaseA1_2.id}`)
				.expect(404)
		});
	});

	describe("Get Song Illustration", () => {
		it("should return the master track illustration", () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(getDummyIllustrationStream());
			return request(app.getHttpServer())
				.get(`/illustrations/songs/${dummyRepository.songB1.id}`)
				.expect(200)
				.expect((res) => {
					expectedFileName(res.headers, dummyRepository.songB1.slug);
					expect(res.body).toStrictEqual(dummyIllustrationBytes);
				});
		});
		it("should return 404, when song does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/songs/-1`)
				.expect(404)
		})
		it("should return 404, when song illustration does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/songs/${dummyRepository.songA2.id}`)
				.expect(404)
		});
	});

	describe("Get Track Illustration", () => {
		it("should return the track illustration", () => {
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fileManagerService, 'fileExists').mockReturnValueOnce(true);
			jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(getDummyIllustrationStream());
			return request(app.getHttpServer())
				.get(`/illustrations/tracks/${dummyRepository.trackA1_2Video.id}`)
				.expect(200)
				.expect((res) => {
					expectedFileName(res.headers, dummyRepository.songA1.slug);
					expect(res.body).toStrictEqual(dummyIllustrationBytes);
				});
		});
		it("should return 404, when track does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/tracks/-1`)
				.expect(404)
		})
		it("should return 404, when track illustration does not exist", () => {
			return request(app.getHttpServer())
				.get(`/illustrations/tracks/${dummyRepository.trackA2_1.id}`)
				.expect(404)
		});
	});

	describe("Update Artist Illustration", () => {
		it("should create the artist illustration", () => {
			return request(app.getHttpServer())
				.post(`/illustrations/artists/${dummyRepository.artistB.id}`)
				.send({
					url: illustrationUrlExample
				})
				.expect(201)
				.expect(async () => {
					expect(fileManagerService.fileExists(`test/assets/metadata/${dummyRepository.artistB.slug}/cover.jpg`));
				});
		});
		it("should update the artist illustration", () => {
			return request(app.getHttpServer())
				.post(`/illustrations/artists/${dummyRepository.artistB.id}`)
				.send({
					url: illustration2UrlExample
				})
				.expect(201)
				.expect(async () => {
					expect(fileManagerService.fileExists(`test/assets/metadata/${dummyRepository.artistB.slug}/cover.jpg`));
				})
		});
		it("should return 404, when artist does not exist", () => {
			return request(app.getHttpServer())
				.post(`/illustrations/artists/-1`)
				.send({
					url: illustrationUrlExample
				})
				.expect(404);
		});
	});

	describe("Update Release Illustration", () => {
		it("should create the release illustration", async () => {
			const releaseIllustrationPath = await releaseService.buildIllustrationPath({ id :dummyRepository.releaseB1_1.id});
			return request(app.getHttpServer())
				.post(`/illustrations/releases/${dummyRepository.releaseB1_1.id}`)
				.send({
					url: illustrationUrlExample
				})
				.expect(201)
				.expect(async () => {
					expect(fileManagerService.fileExists(releaseIllustrationPath));
				});
		});
		it("should update the release illustration", async () => {
			const releaseIllustrationPath = await releaseService.buildIllustrationPath({ id :dummyRepository.releaseB1_1.id});
			return request(app.getHttpServer())
				.post(`/illustrations/releases/${dummyRepository.releaseB1_1.id}`)
				.send({
					url: illustration2UrlExample
				})
				.expect(201)
				.expect(async () => {
					expect(fileManagerService.fileExists(releaseIllustrationPath));
				});
		});
		it("should return 404, when release does not exist", () => {
			return request(app.getHttpServer())
				.put(`/illustrations/releases/-1`)
				.send({
					url: illustrationUrlExample
				})
				.expect(404);
		});
	});

	describe("Update Track Illustration", () => {
		it("should create the track illustration", async () => {
			const releaseIllustrationPath = await trackService.buildIllustrationPath({ id :dummyRepository.trackC1_1.id });
			return request(app.getHttpServer())
				.post(`/illustrations/tracks/${dummyRepository.trackC1_1.id}`)
				.send({
					url: illustrationUrlExample
				})
				.expect(201)
				.expect(async () => {
					expect(fileManagerService.fileExists(releaseIllustrationPath));
				});
		});
		it("should update the track illustration", async () => {
			const releaseIllustrationPath = await trackService.buildIllustrationPath({ id :dummyRepository.trackC1_1.id });
			return request(app.getHttpServer())
				.post(`/illustrations/tracks/${dummyRepository.trackC1_1.id}`)
				.send({
					url: illustrationUrlExample
				})
				.expect(201)
				.expect(async () => {
					expect(fileManagerService.fileExists(releaseIllustrationPath));
				});
		});
		it("should return 404, when track does not exist", () => {
			return request(app.getHttpServer())
				.put(`/illustrations/tracks/-1`)
				.send({
					url: illustrationUrlExample
				})
				.expect(404);
		});
	});

	describe("Delete Artist Illustration", () => {
		it("should delete the artist illustration", () => {
			return request(app.getHttpServer())
				.delete(`/illustrations/artists/${dummyRepository.artistB.id}`)
				.expect(200)
				.expect(() => {
					expect(fileManagerService.fileExists(`test/assets/metadata/${dummyRepository.artistB.slug}/cover.jpg`)).toBe(false);
				})
		});
		it("should do nothing if the artist illustration does nothing", () => {
			return request(app.getHttpServer())
				.delete(`/illustrations/artists/${dummyRepository.artistC.id}`)
				.expect(200)
				.expect(() => {
					expect(fileManagerService.fileExists(`test/assets/metadata/${dummyRepository.artistC.slug}/cover.jpg`)).toBe(false);
				})
		});
		it("should return 404, when artist does not exist", () => {
			return request(app.getHttpServer())
				.delete(`/illustrations/albums/-1`)
				.expect(404);
		});
	});

	describe("Delete Release Illustration", () => {
		it("should delete the release illustration", async () => {
			const releaseIllustrationPath = await releaseService.buildIllustrationPath({ id :dummyRepository.releaseB1_1.id});
			return request(app.getHttpServer())
				.delete(`/illustrations/releases/${dummyRepository.releaseB1_1.id}`)
				.expect(200)
				.expect(() => {
					expect(fileManagerService.fileExists(releaseIllustrationPath)).toBe(false);
				})
		});
		it("should do nothing if the release illustration does nothing", async () => {
			const releaseIllustrationPath = await releaseService.buildIllustrationPath({ id :dummyRepository.compilationReleaseA1.id});
			return request(app.getHttpServer())
				.delete(`/illustrations/releases/${dummyRepository.compilationReleaseA1.id}`)
				.expect(200)
				.expect(() => {
					expect(fileManagerService.fileExists(releaseIllustrationPath)).toBe(false);
				})
		});
		it("should return 404, when release does not exist", () => {
			return request(app.getHttpServer())
				.delete(`/illustrations/releases/-1`)
				.expect(404);
		});
	});

	describe("Delete track Illustration", () => {
		it("should delete the track illustration", async () => {
			const trackIllustrationPath = await trackService.buildIllustrationPath({ id :dummyRepository.trackC1_1.id });
			return request(app.getHttpServer())
				.delete(`/illustrations/tracks/${dummyRepository.trackC1_1.id}`)
				.expect(200)
				.expect(() => {
					expect(fileManagerService.fileExists(trackIllustrationPath)).toBe(false);
				})
		});
		it("should do nothing if the track illustration does nothing", async () => {
			const trackIllustrationPath = await trackService.buildIllustrationPath({ id :dummyRepository.trackA1_2Video.id });
			return request(app.getHttpServer())
				.delete(`/illustrations/tracks/${dummyRepository.trackA1_2Video.id}`)
				.expect(200)
				.expect(() => {
					expect(fileManagerService.fileExists(trackIllustrationPath)).toBe(false);
				})
		});
		it("should return 404, when track does not exist", () => {
			return request(app.getHttpServer())
				.delete(`/illustrations/tracks/-1`)
				.expect(404);
		});
	});
});