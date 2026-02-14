import * as fs from "node:fs";
import { HttpModule } from "@nestjs/axios";
import type { TestingModule } from "@nestjs/testing";
import ArtistModule from "src/artist/artist.module";
import FileManagerModule from "src/file-manager/file-manager.module";
import IllustrationModule from "src/illustration/illustration.module";
import IllustrationService from "src/illustration/illustration.service";
import LabelModule from "src/label/label.module";
import ParserModule from "src/parser/parser.module";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import SettingsModule from "src/settings/settings.module";
import { createTestingModule } from "test/test-module";
import TestPrismaService from "test/test-prisma.service";
import { RegistrationService } from "./registration.service";

jest.setTimeout(120000);

describe("Registration Service", () => {
	let registrationService: RegistrationService;
	let dummyRepository: TestPrismaService;

	let module: TestingModule;
	beforeAll(async () => {
		fs.rm(
			"test/assets/metadata",
			{ recursive: true, force: true },
			() => {},
		);
		module = await createTestingModule({
			imports: [
				HttpModule,
				FileManagerModule,
				IllustrationModule,
				PrismaModule,
				ArtistModule,
				ParserModule,
				SettingsModule,
				LabelModule,
			],
		})
			.overrideProvider(PrismaService)
			.useClass(TestPrismaService)
			.compile();
		registrationService = module.get(RegistrationService);
		dummyRepository = module.get(PrismaService);

		await dummyRepository.onModuleInit();
	});

	afterAll(async () => {
		await module.close();
		fs.rm(
			"test/assets/metadata",
			{ recursive: true, force: true },
			() => {},
		);
	});
	// Note, we do not test metadata here, the controller's tests are good
	// Here we test the logic of illustration's registration

	describe("Register Track illustration", () => {
		const sourceBytes = fs.readFileSync("test/assets/cover.jpg");
		const source2Bytes = fs.readFileSync("test/assets/cover1.jpg");
		const source3Bytes = fs.readFileSync("test/assets/cover2.jpg");

		let discIllustrationPath: string;
		it("should extract release/track illustration, mocking the illustration bytes", async () => {
			jest.spyOn(
				IllustrationService.prototype,
				"getImageStats",
			).mockImplementation(async () => ({
				blurhash: "",
				colors: [],
				aspectRatio: 0,
			}));

			const createdIllustration =
				await registrationService.registerTrackIllustration(
					dummyRepository.trackA1_1,
					sourceBytes,
				);
			discIllustrationPath = `test/assets/metadata/${
				createdIllustration!.id
			}/cover.jpg`;
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			expect(fs.readFileSync(discIllustrationPath)).toStrictEqual(
				sourceBytes,
			);
		});

		let trackIllustrationPath = "";
		it("should extract track illustration, mocking the illustration bytes", async () => {
			jest.spyOn(
				IllustrationService.prototype,
				"getImageStats",
			).mockImplementation(async () => ({
				blurhash: "A",
				colors: [],
				aspectRatio: 0,
			}));
			const createdIllustration =
				await registrationService.registerTrackIllustration(
					dummyRepository.trackA1_1,
					source2Bytes,
				);
			trackIllustrationPath = `test/assets/metadata/${
				createdIllustration!.id
			}/cover.jpg`;
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			expect(fs.existsSync(trackIllustrationPath)).toBe(true);
		});
		it("should re-extract illustration to track folder, mocking the illustration bytes", async () => {
			jest.spyOn(
				IllustrationService.prototype,
				"getImageStats",
			).mockImplementation(async () => ({
				blurhash: "B",
				colors: [],
				aspectRatio: 0,
			}));
			const createdIllustration =
				await registrationService.registerTrackIllustration(
					dummyRepository.trackA1_1,
					source3Bytes,
				);
			expect(fs.existsSync(trackIllustrationPath)).toBe(false);
			expect(fs.existsSync(discIllustrationPath)).toBe(true);
			trackIllustrationPath = `test/assets/metadata/${
				createdIllustration!.id
			}/cover.jpg`;
			expect(fs.existsSync(trackIllustrationPath)).toBe(true);
		});
	});
});
